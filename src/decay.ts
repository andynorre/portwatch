import { DecayConfig, DecayEntry, DecayStore } from './decay.types';

export function createDecayStore(config: DecayConfig): DecayStore {
  return { entries: new Map(), config };
}

/** Compute the decayed weight of an entry at a given point in time. */
export function decayedWeight(
  entry: DecayEntry,
  config: DecayConfig,
  now: number = Date.now()
): number {
  const elapsed = Math.max(0, now - entry.lastSeenAt);
  const halfLives = elapsed / config.halfLifeMs;
  return entry.weight * Math.pow(0.5, halfLives);
}

/**
 * Record an observation for `key`, boosting its weight by `boost`
 * (default 1.0) and capping at config.maxWeight.
 */
export function recordDecay(
  store: DecayStore,
  key: string,
  boost: number = 1.0,
  now: number = Date.now()
): DecayEntry {
  const existing = store.entries.get(key);
  const current = existing ? decayedWeight(existing, store.config, now) : 0;
  const weight = Math.min(current + boost, store.config.maxWeight);
  const entry: DecayEntry = { key, weight, lastSeenAt: now };
  store.entries.set(key, entry);
  return entry;
}

/**
 * Return the effective (decayed) weight for `key`, or 0 if unknown.
 */
export function getDecayedWeight(
  store: DecayStore,
  key: string,
  now: number = Date.now()
): number {
  const entry = store.entries.get(key);
  if (!entry) return 0;
  return decayedWeight(entry, store.config, now);
}

/**
 * Remove all entries whose decayed weight has fallen below config.minWeight.
 * Returns the number of entries pruned.
 */
export function pruneDecayed(
  store: DecayStore,
  now: number = Date.now()
): number {
  let pruned = 0;
  for (const [key, entry] of store.entries) {
    if (decayedWeight(entry, store.config, now) < store.config.minWeight) {
      store.entries.delete(key);
      pruned++;
    }
  }
  return pruned;
}

/** Return all entries sorted by current decayed weight descending. */
export function rankByWeight(
  store: DecayStore,
  now: number = Date.now()
): Array<{ key: string; weight: number }> {
  return Array.from(store.entries.values())
    .map((e) => ({ key: e.key, weight: decayedWeight(e, store.config, now) }))
    .filter((e) => e.weight >= store.config.minWeight)
    .sort((a, b) => b.weight - a.weight);
}
