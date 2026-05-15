import { CooldownEntry, CooldownResult, CooldownStore } from './cooldown.types';

export function createCooldownStore(
  windowMs = 60_000,
  maxCount = 5,
  cooldownMs = 300_000
): CooldownStore {
  return { entries: {}, windowMs, maxCount, cooldownMs };
}

export function cooldownKey(port: number, protocol: string): string {
  return `${protocol}:${port}`;
}

export function checkCooldown(
  store: CooldownStore,
  key: string,
  now = Date.now()
): CooldownResult {
  const entry = store.entries[key];

  if (!entry) {
    return { allowed: true, coolingUntil: null, count: 0 };
  }

  if (now < entry.coolingUntil) {
    return { allowed: false, coolingUntil: entry.coolingUntil, count: entry.count };
  }

  return { allowed: true, coolingUntil: null, count: entry.count };
}

export function recordCooldown(
  store: CooldownStore,
  key: string,
  now = Date.now()
): CooldownResult {
  const existing = store.entries[key];

  if (!existing || now - existing.firstSeen > store.windowMs) {
    store.entries[key] = {
      key,
      firstSeen: now,
      lastSeen: now,
      count: 1,
      coolingUntil: 0,
    };
    return { allowed: true, coolingUntil: null, count: 1 };
  }

  existing.lastSeen = now;
  existing.count += 1;

  if (existing.count >= store.maxCount) {
    existing.coolingUntil = now + store.cooldownMs;
    return { allowed: false, coolingUntil: existing.coolingUntil, count: existing.count };
  }

  return { allowed: true, coolingUntil: null, count: existing.count };
}

export function purgeCooldowns(store: CooldownStore, now = Date.now()): number {
  let removed = 0;
  for (const key of Object.keys(store.entries)) {
    const entry = store.entries[key];
    if (now > entry.coolingUntil && now - entry.lastSeen > store.windowMs) {
      delete store.entries[key];
      removed++;
    }
  }
  return removed;
}

export function resetCooldown(store: CooldownStore, key: string): boolean {
  if (store.entries[key]) {
    delete store.entries[key];
    return true;
  }
  return false;
}
