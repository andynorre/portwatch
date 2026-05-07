import {
  createDedupStore,
  dedupKey,
  isDuplicate,
  recordDedup,
  purgeExpiredDedup,
  getDedupStats,
} from './dedup';

const NOW = 1_700_000_000_000;

describe('createDedupStore', () => {
  it('creates store with default window', () => {
    const store = createDedupStore();
    expect(store.windowMs).toBe(60_000);
    expect(store.entries).toEqual({});
  });

  it('accepts custom window', () => {
    const store = createDedupStore(5_000);
    expect(store.windowMs).toBe(5_000);
  });
});

describe('dedupKey', () => {
  it('builds a colon-separated key', () => {
    expect(dedupKey('tcp', 8080, 'node')).toBe('tcp:8080:node');
  });
});

describe('isDuplicate', () => {
  it('returns false for unknown key', () => {
    const store = createDedupStore();
    expect(isDuplicate(store, 'tcp:80:nginx', NOW)).toBe(false);
  });

  it('returns true within window', () => {
    const store = createDedupStore(10_000);
    recordDedup(store, 'tcp:80:nginx', NOW);
    expect(isDuplicate(store, 'tcp:80:nginx', NOW + 5_000)).toBe(true);
  });

  it('returns false after window expires', () => {
    const store = createDedupStore(10_000);
    recordDedup(store, 'tcp:80:nginx', NOW);
    expect(isDuplicate(store, 'tcp:80:nginx', NOW + 11_000)).toBe(false);
  });
});

describe('recordDedup', () => {
  it('creates a new entry', () => {
    const store = createDedupStore();
    const entry = recordDedup(store, 'udp:53:dns', NOW);
    expect(entry.count).toBe(1);
    expect(entry.firstSeen).toBe(NOW);
  });

  it('increments count for duplicate within window', () => {
    const store = createDedupStore(30_000);
    recordDedup(store, 'udp:53:dns', NOW);
    const entry = recordDedup(store, 'udp:53:dns', NOW + 1_000);
    expect(entry.count).toBe(2);
    expect(entry.firstSeen).toBe(NOW);
  });

  it('resets entry after window expires', () => {
    const store = createDedupStore(5_000);
    recordDedup(store, 'udp:53:dns', NOW);
    const entry = recordDedup(store, 'udp:53:dns', NOW + 6_000);
    expect(entry.count).toBe(1);
    expect(entry.firstSeen).toBe(NOW + 6_000);
  });
});

describe('purgeExpiredDedup', () => {
  it('removes entries past window', () => {
    const store = createDedupStore(5_000);
    recordDedup(store, 'tcp:443:nginx', NOW);
    recordDedup(store, 'tcp:80:nginx', NOW + 3_000);
    const removed = purgeExpiredDedup(store, NOW + 6_000);
    expect(removed).toBe(1);
    expect(store.entries['tcp:443:nginx']).toBeUndefined();
  });
});

describe('getDedupStats', () => {
  it('returns total and keys', () => {
    const store = createDedupStore();
    recordDedup(store, 'tcp:22:sshd', NOW);
    recordDedup(store, 'tcp:80:nginx', NOW);
    const stats = getDedupStats(store);
    expect(stats.total).toBe(2);
    expect(stats.keys).toContain('tcp:22:sshd');
  });
});
