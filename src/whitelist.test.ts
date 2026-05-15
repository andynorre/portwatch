import {
  createWhitelistStore,
  addWhitelistRule,
  removeWhitelistRule,
  isWhitelisted,
  filterWhitelisted,
  getWhitelistRules,
} from './whitelist';
import { PortInfo } from './baseline.types';

const makePort = (overrides: Partial<PortInfo> = {}): PortInfo => ({
  port: 8080,
  protocol: 'tcp',
  process: 'node',
  pid: 1234,
  ...overrides,
});

describe('whitelist', () => {
  it('creates an empty store', () => {
    const store = createWhitelistStore();
    expect(store.rules).toHaveLength(0);
  });

  it('adds a rule', () => {
    const store = addWhitelistRule(createWhitelistStore(), { port: 8080, protocol: 'tcp' });
    expect(store.rules).toHaveLength(1);
  });

  it('does not add duplicate rules', () => {
    let store = createWhitelistStore();
    store = addWhitelistRule(store, { port: 8080, protocol: 'tcp', process: 'node' });
    store = addWhitelistRule(store, { port: 8080, protocol: 'tcp', process: 'node' });
    expect(store.rules).toHaveLength(1);
  });

  it('removes a rule by port', () => {
    let store = addWhitelistRule(createWhitelistStore(), { port: 8080 });
    store = removeWhitelistRule(store, 8080);
    expect(store.rules).toHaveLength(0);
  });

  it('removes only matching rule when protocol specified', () => {
    let store = createWhitelistStore();
    store = addWhitelistRule(store, { port: 8080, protocol: 'tcp' });
    store = addWhitelistRule(store, { port: 8080, protocol: 'udp' });
    store = removeWhitelistRule(store, 8080, 'tcp');
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].protocol).toBe('udp');
  });

  it('returns true for whitelisted port', () => {
    const store = addWhitelistRule(createWhitelistStore(), { port: 8080, protocol: 'tcp' });
    expect(isWhitelisted(store, makePort())).toBe(true);
  });

  it('returns false when port not in whitelist', () => {
    const store = createWhitelistStore();
    expect(isWhitelisted(store, makePort())).toBe(false);
  });

  it('respects process filter in rule', () => {
    const store = addWhitelistRule(createWhitelistStore(), { port: 8080, process: 'nginx' });
    expect(isWhitelisted(store, makePort({ process: 'node' }))).toBe(false);
    expect(isWhitelisted(store, makePort({ process: 'nginx' }))).toBe(true);
  });

  it('filters whitelisted ports from list', () => {
    let store = createWhitelistStore();
    store = addWhitelistRule(store, { port: 80 });
    store = addWhitelistRule(store, { port: 443 });
    const ports = [makePort({ port: 80 }), makePort({ port: 443 }), makePort({ port: 8080 })];
    const result = filterWhitelisted(store, ports);
    expect(result).toHaveLength(1);
    expect(result[0].port).toBe(8080);
  });

  it('returns a copy of rules via getWhitelistRules', () => {
    const store = addWhitelistRule(createWhitelistStore(), { port: 22 });
    const rules = getWhitelistRules(store);
    rules.push({ port: 9999 });
    expect(store.rules).toHaveLength(1);
  });
});
