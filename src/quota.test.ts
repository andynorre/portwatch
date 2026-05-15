import {
  createQuotaStore,
  registerQuotaRule,
  removeQuotaRule,
  checkQuota,
  resetQuota,
  purgeExpiredQuotas,
} from './quota';
import { QuotaRule } from './quota.types';

const makePort = (process = 'node', user = 'alice') => ({
  port: 3000,
  protocol: 'tcp' as const,
  state: 'LISTEN' as const,
  process,
  user,
  pid: 1234,
});

const globalRule: QuotaRule = {
  id: 'global-rule',
  maxPorts: 2,
  windowMs: 60_000,
  scope: 'global',
};

const processRule: QuotaRule = {
  id: 'process-rule',
  maxPorts: 1,
  windowMs: 30_000,
  scope: 'process',
};

describe('createQuotaStore', () => {
  it('returns empty store', () => {
    const store = createQuotaStore();
    expect(store.rules.size).toBe(0);
    expect(store.entries.size).toBe(0);
  });
});

describe('registerQuotaRule / removeQuotaRule', () => {
  it('adds and removes rules', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    expect(store.rules.has('global-rule')).toBe(true);
    expect(removeQuotaRule(store, 'global-rule')).toBe(true);
    expect(store.rules.has('global-rule')).toBe(false);
  });

  it('returns false when removing non-existent rule', () => {
    const store = createQuotaStore();
    expect(removeQuotaRule(store, 'missing')).toBe(false);
  });
});

describe('checkQuota', () => {
  it('allows ports within quota', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    const result = checkQuota(store, makePort());
    expect(result[0].allowed).toBe(true);
    expect(result[0].current).toBe(1);
  });

  it('blocks when quota exceeded', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    const port = makePort();
    checkQuota(store, port);
    checkQuota(store, port);
    const result = checkQuota(store, port);
    expect(result[0].allowed).toBe(false);
    expect(result[0].current).toBe(3);
  });

  it('scopes quota by process', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, processRule);
    checkQuota(store, makePort('nginx'));
    const result = checkQuota(store, makePort('node'));
    expect(result[0].allowed).toBe(true);
  });

  it('resets window after windowMs elapsed', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    const port = makePort();
    const t0 = 1_000_000;
    checkQuota(store, port, t0);
    checkQuota(store, port, t0);
    const result = checkQuota(store, port, t0 + globalRule.windowMs + 1);
    expect(result[0].allowed).toBe(true);
    expect(result[0].current).toBe(1);
  });
});

describe('resetQuota', () => {
  it('clears an entry', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    checkQuota(store, makePort());
    resetQuota(store, 'global-rule', '__global__');
    const result = checkQuota(store, makePort());
    expect(result[0].current).toBe(1);
  });
});

describe('purgeExpiredQuotas', () => {
  it('removes expired entries', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    const t0 = 1_000_000;
    checkQuota(store, makePort(), t0);
    expect(store.entries.size).toBe(1);
    const removed = purgeExpiredQuotas(store, t0 + globalRule.windowMs + 1);
    expect(removed).toBe(1);
    expect(store.entries.size).toBe(0);
  });

  it('keeps entries within window', () => {
    const store = createQuotaStore();
    registerQuotaRule(store, globalRule);
    const t0 = 1_000_000;
    checkQuota(store, makePort(), t0);
    const removed = purgeExpiredQuotas(store, t0 + 1_000);
    expect(removed).toBe(0);
    expect(store.entries.size).toBe(1);
  });
});
