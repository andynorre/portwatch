import type { DedupStore, DedupEntry } from './dedup.types';

const DEFAULT_WINDOW_MS = 60_000;

export function createDedupStore(windowMs: number = DEFAULT_WINDOW_MS): DedupStore {
  return { entries: {}, windowMs };
}

export function dedupKey(protocol: string, port: number, process: string): string {
  return `${protocol}:${port}:${process}`;
}

export function isDuplicate(
  store: DedupStore,
  key: string,
  now: number = Date.now()
): boolean {
  const entry = store.entries[key];
  if (!entry) return false;
  return now - entry.firstSeen < store.windowMs;
}

export function recordDedup(
  store: DedupStore,
  key: string,
  now: number = Date.now()
): DedupEntry {
  const existing = store.entries[key];
  if (existing && now - existing.firstSeen < store.windowMs) {
    existing.lastSeen = now;
    existing.count += 1;
    return existing;
  }
  const entry: DedupEntry = { key, firstSeen: now, lastSeen: now, count: 1 };
  store.entries[key] = entry;
  return entry;
}

export function purgeExpiredDedup(
  store: DedupStore,
  now: number = Date.now()
): number {
  let removed = 0;
  for (const key of Object.keys(store.entries)) {
    if (now - store.entries[key].firstSeen >= store.windowMs) {
      delete store.entries[key];
      removed++;
    }
  }
  return removed;
}

export function getDedupStats(store: DedupStore): { total: number; keys: string[] } {
  const keys = Object.keys(store.entries);
  return { total: keys.length, keys };
}
