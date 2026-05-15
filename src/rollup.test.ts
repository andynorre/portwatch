import {
  createRollupStore,
  rollupKey,
  recordRollupAlert,
  purgeRollupEntries,
  summarizeRollup,
} from './rollup';

const NOW = 1_700_000_000_000;

describe('createRollupStore', () => {
  it('creates a store with default windowMs', () => {
    const store = createRollupStore();
    expect(store.windowMs).toBe(60_000);
    expect(store.entries).toEqual({});
  });

  it('accepts a custom windowMs', () => {
    const store = createRollupStore(30_000);
    expect(store.windowMs).toBe(30_000);
  });
});

describe('rollupKey', () => {
  it('produces a deterministic key', () => {
    expect(rollupKey(8080, 'tcp', 'node')).toBe('8080:tcp:node');
  });
});

describe('recordRollupAlert', () => {
  it('creates a new entry on first alert', () => {
    const store = createRollupStore();
    const next = recordRollupAlert(store, 8080, 'tcp', 'node', 'high', NOW);
    const entry = next.entries['8080:tcp:node'];
    expect(entry).toBeDefined();
    expect(entry.alertCount).toBe(1);
    expect(entry.severities).toEqual(['high']);
    expect(entry.firstSeen).toBe(NOW);
    expect(entry.lastSeen).toBe(NOW);
  });

  it('increments alertCount on subsequent alerts', () => {
    let store = createRollupStore();
    store = recordRollupAlert(store, 8080, 'tcp', 'node', 'high', NOW);
    store = recordRollupAlert(store, 8080, 'tcp', 'node', 'critical', NOW + 1000);
    const entry = store.entries['8080:tcp:node'];
    expect(entry.alertCount).toBe(2);
    expect(entry.severities).toEqual(['high', 'critical']);
    expect(entry.firstSeen).toBe(NOW);
    expect(entry.lastSeen).toBe(NOW + 1000);
  });

  it('does not mutate the original store', () => {
    const store = createRollupStore();
    recordRollupAlert(store, 8080, 'tcp', 'node', 'low', NOW);
    expect(store.entries).toEqual({});
  });
});

describe('purgeRollupEntries', () => {
  it('removes entries older than windowMs', () => {
    let store = createRollupStore(60_000);
    store = recordRollupAlert(store, 80, 'tcp', 'nginx', 'low', NOW - 70_000);
    store = recordRollupAlert(store, 443, 'tcp', 'nginx', 'low', NOW);
    const purged = purgeRollupEntries(store, NOW);
    expect(Object.keys(purged.entries)).toHaveLength(1);
    expect(purged.entries['443:tcp:nginx']).toBeDefined();
  });
});

describe('summarizeRollup', () => {
  it('returns correct totals and topPorts', () => {
    let store = createRollupStore(60_000);
    store = recordRollupAlert(store, 8080, 'tcp', 'node', 'high', NOW);
    store = recordRollupAlert(store, 8080, 'tcp', 'node', 'high', NOW + 100);
    store = recordRollupAlert(store, 443, 'tcp', 'nginx', 'low', NOW);
    const summary = summarizeRollup(store, 5, NOW);
    expect(summary.totalPorts).toBe(2);
    expect(summary.totalAlerts).toBe(3);
    expect(summary.topPorts[0].port).toBe(8080);
    expect(summary.topPorts[0].alertCount).toBe(2);
  });

  it('limits topPorts to topN', () => {
    let store = createRollupStore(60_000);
    for (let p = 3000; p < 3010; p++) {
      store = recordRollupAlert(store, p, 'tcp', 'proc', 'low', NOW);
    }
    const summary = summarizeRollup(store, 3, NOW);
    expect(summary.topPorts).toHaveLength(3);
  });
});
