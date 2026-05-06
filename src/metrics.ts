import * as fs from 'fs';
import { PortMetrics, MetricsStore, MetricsSummary } from './metrics.types';

const DEFAULT_METRICS_PATH = './portwatch-metrics.json';

export function createMetricsStore(): MetricsStore {
  return {
    entries: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function entryKey(port: number, protocol: string): string {
  return `${protocol}:${port}`;
}

export function recordPortSeen(
  store: MetricsStore,
  port: number,
  protocol: string,
  process: string
): MetricsStore {
  const key = entryKey(port, protocol);
  const now = Date.now();
  const existing = store.entries[key];

  const updated: PortMetrics = existing
    ? { ...existing, scanCount: existing.scanCount + 1, lastSeen: now, process }
    : { port, protocol, process, scanCount: 1, firstSeen: now, lastSeen: now, alertCount: 0 };

  return {
    ...store,
    entries: { ...store.entries, [key]: updated },
    updatedAt: now,
  };
}

export function recordPortAlert(
  store: MetricsStore,
  port: number,
  protocol: string
): MetricsStore {
  const key = entryKey(port, protocol);
  const existing = store.entries[key];
  if (!existing) return store;

  return {
    ...store,
    entries: { ...store.entries, [key]: { ...existing, alertCount: existing.alertCount + 1 } },
    updatedAt: Date.now(),
  };
}

export function summarizeMetrics(store: MetricsStore): MetricsSummary {
  const values = Object.values(store.entries);
  if (values.length === 0) {
    return { totalPorts: 0, totalAlerts: 0, mostActivePort: null, mostAlertedPort: null, timeRangeMs: 0 };
  }

  const totalAlerts = values.reduce((sum, e) => sum + e.alertCount, 0);
  const mostActivePort = values.reduce((a, b) => (b.scanCount > a.scanCount ? b : a));
  const mostAlertedPort = values.reduce((a, b) => (b.alertCount > a.alertCount ? b : a));
  const timeRangeMs = store.updatedAt - store.createdAt;

  return { totalPorts: values.length, totalAlerts, mostActivePort, mostAlertedPort, timeRangeMs };
}

export function saveMetrics(store: MetricsStore, filePath: string = DEFAULT_METRICS_PATH): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function loadMetrics(filePath: string = DEFAULT_METRICS_PATH): MetricsStore {
  if (!fs.existsSync(filePath)) return createMetricsStore();
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as MetricsStore;
}
