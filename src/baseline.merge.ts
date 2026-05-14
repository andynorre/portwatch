import type { BaselineStore, PortEntry } from "./baseline.types";

/**
 * Strategy used when merging a live scan into an existing baseline.
 * - "union"      : keep all ports from both baseline and scan
 * - "replace"    : discard baseline, use scan as new baseline
 * - "intersect"  : keep only ports present in both
 */
export type MergeStrategy = "union" | "replace" | "intersect";

function portKey(p: PortEntry): string {
  return `${p.protocol}:${p.port}:${p.process}`;
}

export function mergeBaseline(
  existing: BaselineStore,
  incoming: PortEntry[],
  strategy: MergeStrategy = "union"
): BaselineStore {
  let merged: PortEntry[];

  switch (strategy) {
    case "replace": {
      merged = [...incoming];
      break;
    }
    case "intersect": {
      const incomingKeys = new Set(incoming.map(portKey));
      merged = existing.ports.filter((p) => incomingKeys.has(portKey(p)));
      break;
    }
    case "union":
    default: {
      const seen = new Map<string, PortEntry>();
      for (const p of existing.ports) seen.set(portKey(p), p);
      for (const p of incoming) seen.set(portKey(p), p);
      merged = Array.from(seen.values());
      break;
    }
  }

  return {
    ...existing,
    updatedAt: new Date().toISOString(),
    ports: merged,
  };
}

export function pruneBaseline(
  store: BaselineStore,
  maxEntries: number
): BaselineStore {
  if (store.ports.length <= maxEntries) return store;
  return {
    ...store,
    updatedAt: new Date().toISOString(),
    ports: store.ports.slice(0, maxEntries),
  };
}
