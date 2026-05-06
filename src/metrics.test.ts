import * as fs from 'fs';
import {
  createMetricsStore,
  recordPortSeen,
  recordPortAlert,
  summarizeMetrics,
  saveMetrics,
  loadMetrics,
} from './metrics';

const TEST_PATH = '/tmp/portwatch-metrics-test.json';

afterEach(() => {
  if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
});

describe('createMetricsStore', () => {
  it('creates an empty store with timestamps', () => {
    const store = createMetricsStore();
    expect(store.entries).toEqual({});
    expect(store.createdAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('recordPortSeen', () => {
  it('adds a new entry on first sight', () => {
    const store = recordPortSeen(createMetricsStore(), 8080, 'tcp', 'node');
    expect(store.entries['tcp:8080']).toBeDefined();
    expect(store.entries['tcp:8080'].scanCount).toBe(1);
  });

  it('increments scanCount on subsequent sightings', () => {
    let store = createMetricsStore();
    store = recordPortSeen(store, 8080, 'tcp', 'node');
    store = recordPortSeen(store, 8080, 'tcp', 'node');
    expect(store.entries['tcp:8080'].scanCount).toBe(2);
  });

  it('updates process name', () => {
    let store = recordPortSeen(createMetricsStore(), 443, 'tcp', 'nginx');
    store = recordPortSeen(store, 443, 'tcp', 'caddy');
    expect(store.entries['tcp:443'].process).toBe('caddy');
  });
});

describe('recordPortAlert', () => {
  it('increments alertCount for known port', () => {
    let store = recordPortSeen(createMetricsStore(), 9000, 'tcp', 'unknown');
    store = recordPortAlert(store, 9000, 'tcp');
    expect(store.entries['tcp:9000'].alertCount).toBe(1);
  });

  it('returns store unchanged for unknown port', () => {
    const store = createMetricsStore();
    const result = recordPortAlert(store, 9999, 'tcp');
    expect(result).toEqual(store);
  });
});

describe('summarizeMetrics', () => {
  it('returns zero summary for empty store', () => {
    const summary = summarizeMetrics(createMetricsStore());
    expect(summary.totalPorts).toBe(0);
    expect(summary.mostActivePort).toBeNull();
  });

  it('identifies most active and most alerted port', () => {
    let store = createMetricsStore();
    store = recordPortSeen(store, 80, 'tcp', 'nginx');
    store = recordPortSeen(store, 80, 'tcp', 'nginx');
    store = recordPortSeen(store, 443, 'tcp', 'nginx');
    store = recordPortAlert(store, 443, 'tcp');
    const summary = summarizeMetrics(store);
    expect(summary.mostActivePort?.port).toBe(80);
    expect(summary.mostAlertedPort?.port).toBe(443);
  });
});

describe('saveMetrics / loadMetrics', () => {
  it('round-trips a metrics store to disk', () => {
    let store = recordPortSeen(createMetricsStore(), 3000, 'tcp', 'app');
    saveMetrics(store, TEST_PATH);
    const loaded = loadMetrics(TEST_PATH);
    expect(loaded.entries['tcp:3000'].port).toBe(3000);
  });

  it('returns empty store when file does not exist', () => {
    const store = loadMetrics('/tmp/nonexistent-metrics.json');
    expect(store.entries).toEqual({});
  });
});
