import * as fs from 'fs';
import {
  createMetricsStore,
  recordPortSeen,
  recordPortAlert,
  summarizeMetrics,
  saveMetrics,
  loadMetrics,
} from './metrics';

const TEST_PATH = '/tmp/portwatch-metrics-integration.json';

afterEach(() => {
  if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
});

describe('metrics integration: full lifecycle', () => {
  it('accumulates metrics across multiple save/load cycles', () => {
    let store = createMetricsStore();

    // Simulate scan cycle 1
    store = recordPortSeen(store, 8080, 'tcp', 'node');
    store = recordPortSeen(store, 443, 'tcp', 'nginx');
    saveMetrics(store, TEST_PATH);

    // Simulate scan cycle 2 — load and update
    store = loadMetrics(TEST_PATH);
    store = recordPortSeen(store, 8080, 'tcp', 'node');
    store = recordPortSeen(store, 9000, 'tcp', 'python');
    store = recordPortAlert(store, 9000, 'tcp');
    saveMetrics(store, TEST_PATH);

    // Simulate scan cycle 3 — load and summarize
    store = loadMetrics(TEST_PATH);
    store = recordPortSeen(store, 8080, 'tcp', 'node');
    store = recordPortAlert(store, 9000, 'tcp');
    saveMetrics(store, TEST_PATH);

    const final = loadMetrics(TEST_PATH);
    const summary = summarizeMetrics(final);

    expect(summary.totalPorts).toBe(3);
    expect(summary.totalAlerts).toBe(2);
    expect(summary.mostActivePort?.port).toBe(8080);
    expect(final.entries['tcp:8080'].scanCount).toBe(3);
    expect(final.entries['tcp:9000'].alertCount).toBe(2);
  });

  it('handles ports with identical scan counts by returning one deterministically', () => {
    let store = createMetricsStore();
    store = recordPortSeen(store, 80, 'tcp', 'nginx');
    store = recordPortSeen(store, 443, 'tcp', 'nginx');
    const summary = summarizeMetrics(store);
    expect(summary.mostActivePort).not.toBeNull();
    expect([80, 443]).toContain(summary.mostActivePort?.port);
  });
});
