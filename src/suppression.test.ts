import * as fs from 'fs';
import {
  createSuppressionStore,
  addRule,
  removeRule,
  purgeExpired,
  isSuppressed,
  saveSuppressionStore,
  loadSuppressionStore,
} from './suppression';
import { PortEntry } from './scanner';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const entry: PortEntry = { port: 8080, protocol: 'tcp', process: 'node', pid: 1234, state: 'LISTEN' };

describe('createSuppressionStore', () => {
  it('returns empty store', () => {
    expect(createSuppressionStore()).toEqual({ rules: [] });
  });
});

describe('addRule', () => {
  it('adds a rule with generated id and createdAt', () => {
    const store = createSuppressionStore();
    const updated = addRule(store, { port: 8080, reason: 'dev server' });
    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0].id).toMatch(/^rule_/);
    expect(updated.rules[0].port).toBe(8080);
  });
});

describe('removeRule', () => {
  it('removes rule by id', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 9000, reason: 'test' });
    const id = store.rules[0].id;
    const updated = removeRule(store, id);
    expect(updated.rules).toHaveLength(0);
  });
});

describe('purgeExpired', () => {
  it('removes expired rules', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 1111, reason: 'expired', expiresAt: Date.now() - 1000 });
    store = addRule(store, { port: 2222, reason: 'permanent' });
    const purged = purgeExpired(store);
    expect(purged.rules).toHaveLength(1);
    expect(purged.rules[0].port).toBe(2222);
  });
});

describe('isSuppressed', () => {
  it('returns true when port matches', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 8080, reason: 'known' });
    expect(isSuppressed(store, entry)).toBe(true);
  });

  it('returns false when port does not match', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 9090, reason: 'other' });
    expect(isSuppressed(store, entry)).toBe(false);
  });

  it('matches by port range', () => {
    let store = createSuppressionStore();
    store = addRule(store, { portRange: [8000, 9000], reason: 'range' });
    expect(isSuppressed(store, entry)).toBe(true);
  });

  it('respects protocol filter', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 8080, protocol: 'udp', reason: 'udp only' });
    expect(isSuppressed(store, entry)).toBe(false);
  });

  it('returns false for expired rule', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 8080, reason: 'expired', expiresAt: Date.now() - 1 });
    expect(isSuppressed(store, entry)).toBe(false);
  });
});

describe('saveSuppressionStore / loadSuppressionStore', () => {
  it('saves and loads store', () => {
    const store = addRule(createSuppressionStore(), { port: 3000, reason: 'test' });
    mockedFs.writeFileSync.mockImplementation(() => {});
    saveSuppressionStore(store, '/tmp/sup.json');
    expect(mockedFs.writeFileSync).toHaveBeenCalled();

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(store) as any);
    const loaded = loadSuppressionStore('/tmp/sup.json');
    expect(loaded.rules).toHaveLength(1);
  });

  it('returns empty store when file missing', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const loaded = loadSuppressionStore('/tmp/missing.json');
    expect(loaded).toEqual({ rules: [] });
  });
});
