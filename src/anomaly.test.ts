import { describe, it, expect } from 'vitest';
import {
  createAnomalyStore,
  detectAnomalies,
  recordAnomalies,
  getAnomaliesByKind,
  purgeAnomalies,
} from './anomaly';
import type { PortEntry } from './scanner';

const base = (overrides: Partial<PortEntry> = {}): PortEntry => ({
  port: 8080,
  protocol: 'tcp',
  process: 'node',
  user: 'alice',
  pid: 100,
  ...overrides,
});

describe('createAnomalyStore', () => {
  it('returns empty store', () => {
    const store = createAnomalyStore();
    expect(store.anomalies).toHaveLength(0);
    expect(store.lastEvaluatedAt).toBeNull();
  });
});

describe('detectAnomalies', () => {
  it('detects new port', () => {
    const anomalies = detectAnomalies([], [base()], 1000);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].kind).toBe('new_port');
    expect(anomalies[0].port).toBe(8080);
  });

  it('detects closed port', () => {
    const anomalies = detectAnomalies([base()], [], 1000);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].kind).toBe('port_closed');
  });

  it('detects process change', () => {
    const anomalies = detectAnomalies([base({ process: 'python' })], [base({ process: 'node' })], 1000);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].kind).toBe('process_changed');
    expect(anomalies[0].previous).toBe('python');
    expect(anomalies[0].current).toBe('node');
  });

  it('detects user change', () => {
    const anomalies = detectAnomalies([base({ user: 'root' })], [base({ user: 'alice' })], 1000);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].kind).toBe('user_changed');
  });

  it('returns empty when no changes', () => {
    const anomalies = detectAnomalies([base()], [base()], 1000);
    expect(anomalies).toHaveLength(0);
  });
});

describe('recordAnomalies', () => {
  it('appends anomalies and updates timestamp', () => {
    const store = createAnomalyStore();
    const detected = detectAnomalies([], [base()], 2000);
    const updated = recordAnomalies(store, detected, 2000);
    expect(updated.anomalies).toHaveLength(1);
    expect(updated.lastEvaluatedAt).toBe(2000);
  });
});

describe('getAnomaliesByKind', () => {
  it('filters by kind', () => {
    const store = createAnomalyStore();
    const detected = detectAnomalies([], [base(), base({ port: 9090 })], 1000);
    const updated = recordAnomalies(store, detected, 1000);
    const results = getAnomaliesByKind(updated, 'new_port');
    expect(results).toHaveLength(2);
  });
});

describe('purgeAnomalies', () => {
  it('removes anomalies older than threshold', () => {
    const store = createAnomalyStore();
    const detected = detectAnomalies([], [base()], 500);
    const updated = recordAnomalies(store, detected, 500);
    const purged = purgeAnomalies(updated, 1000, 2000);
    expect(purged.anomalies).toHaveLength(0);
  });

  it('keeps recent anomalies', () => {
    const store = createAnomalyStore();
    const detected = detectAnomalies([], [base()], 1500);
    const updated = recordAnomalies(store, detected, 1500);
    const purged = purgeAnomalies(updated, 1000, 2000);
    expect(purged.anomalies).toHaveLength(1);
  });
});
