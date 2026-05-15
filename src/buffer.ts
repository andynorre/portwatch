import { BufferedAlert, BufferStore, BufferSummary } from './buffer.types';

export function createBufferStore(
  maxSize = 100,
  flushIntervalMs = 5000
): BufferStore {
  return {
    entries: [],
    maxSize,
    flushIntervalMs,
    lastFlushedAt: Date.now(),
  };
}

export function addToBuffer(
  store: BufferStore,
  alert: BufferedAlert
): BufferStore {
  const entries = [...store.entries, alert];
  const trimmed =
    entries.length > store.maxSize
      ? entries.slice(entries.length - store.maxSize)
      : entries;
  return { ...store, entries: trimmed };
}

export function shouldFlush(store: BufferStore, now = Date.now()): boolean {
  if (store.entries.length === 0) return false;
  if (store.entries.length >= store.maxSize) return true;
  return now - store.lastFlushedAt >= store.flushIntervalMs;
}

export function flushBuffer(
  store: BufferStore,
  now = Date.now()
): { flushed: BufferedAlert[]; store: BufferStore } {
  const flushed = [...store.entries];
  return {
    flushed,
    store: { ...store, entries: [], lastFlushedAt: now },
  };
}

export function summarizeBuffer(store: BufferStore): BufferSummary {
  if (store.entries.length === 0) {
    return { count: 0, oldestAt: null, newestAt: null, severityCounts: {} };
  }
  const timestamps = store.entries.map((e) => e.timestamp);
  const severityCounts: Record<string, number> = {};
  for (const entry of store.entries) {
    severityCounts[entry.severity] = (severityCounts[entry.severity] ?? 0) + 1;
  }
  return {
    count: store.entries.length,
    oldestAt: Math.min(...timestamps),
    newestAt: Math.max(...timestamps),
    severityCounts,
  };
}

export function purgeBufferBefore(
  store: BufferStore,
  cutoffMs: number
): BufferStore {
  return {
    ...store,
    entries: store.entries.filter((e) => e.timestamp >= cutoffMs),
  };
}
