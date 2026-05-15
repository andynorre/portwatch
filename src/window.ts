import { WindowStore, WindowEntry, WindowSummary } from './window.types';

export function createWindowStore(windowMs: number): WindowStore {
  return {
    windowMs,
    entries: new Map(),
  };
}

export function windowKey(port: number, protocol: string): string {
  return `${protocol}:${port}`;
}

export function recordWindowEvent(
  store: WindowStore,
  key: string,
  now: number = Date.now()
): WindowEntry {
  const existing = store.entries.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
    return existing;
  }
  const entry: WindowEntry = {
    key,
    windowStart: now,
    count: 1,
    firstSeen: now,
    lastSeen: now,
  };
  store.entries.set(key, entry);
  return entry;
}

export function purgeWindowEntries(
  store: WindowStore,
  now: number = Date.now()
): number {
  let pruned = 0;
  for (const [key, entry] of store.entries) {
    if (now - entry.windowStart > store.windowMs) {
      store.entries.delete(key);
      pruned++;
    }
  }
  return pruned;
}

export function getWindowSummary(
  store: WindowStore,
  key: string,
  now: number = Date.now()
): WindowSummary | null {
  const entry = store.entries.get(key);
  if (!entry) return null;
  if (now - entry.windowStart > store.windowMs) return null;
  const elapsed = Math.max(1, entry.lastSeen - entry.firstSeen) / 1000;
  return {
    key: entry.key,
    count: entry.count,
    windowMs: store.windowMs,
    firstSeen: entry.firstSeen,
    lastSeen: entry.lastSeen,
    rate: entry.count / elapsed,
  };
}

export function getAllWindowSummaries(
  store: WindowStore,
  now: number = Date.now()
): WindowSummary[] {
  const summaries: WindowSummary[] = [];
  for (const entry of store.entries.values()) {
    const summary = getWindowSummary(store, entry.key, now);
    if (summary) summaries.push(summary);
  }
  return summaries;
}
