import { RollupEntry, RollupStore, RollupSummary } from './rollup.types';

const ROLLUP_KEY_SEP = ':';

export function createRollupStore(windowMs = 60_000): RollupStore {
  return {
    entries: {},
    windowMs,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function rollupKey(port: number, protocol: string, process: string): string {
  return [port, protocol, process].join(ROLLUP_KEY_SEP);
}

export function recordRollupAlert(
  store: RollupStore,
  port: number,
  protocol: string,
  process: string,
  severity: string,
  now = Date.now()
): RollupStore {
  const key = rollupKey(port, protocol, process);
  const existing = store.entries[key];

  const entry: RollupEntry = existing
    ? {
        ...existing,
        alertCount: existing.alertCount + 1,
        lastSeen: now,
        severities: [...existing.severities, severity],
      }
    : {
        port,
        protocol,
        process,
        alertCount: 1,
        firstSeen: now,
        lastSeen: now,
        severities: [severity],
      };

  return {
    ...store,
    entries: { ...store.entries, [key]: entry },
    updatedAt: now,
  };
}

export function purgeRollupEntries(store: RollupStore, now = Date.now()): RollupStore {
  const cutoff = now - store.windowMs;
  const entries: Record<string, RollupEntry> = {};
  for (const [key, entry] of Object.entries(store.entries)) {
    if (entry.lastSeen >= cutoff) {
      entries[key] = entry;
    }
  }
  return { ...store, entries, updatedAt: now };
}

export function summarizeRollup(store: RollupStore, topN = 5, now = Date.now()): RollupSummary {
  const active = purgeRollupEntries(store, now);
  const all = Object.values(active.entries);
  const totalAlerts = all.reduce((sum, e) => sum + e.alertCount, 0);
  const topPorts = [...all]
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, topN);

  return {
    totalPorts: all.length,
    totalAlerts,
    topPorts,
    windowMs: store.windowMs,
    generatedAt: now,
  };
}
