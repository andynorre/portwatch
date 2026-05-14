import { EscalationStore, EscalationEntry, EscalationLevel, EscalationRule } from './escalation.types';

const DEFAULT_RULES: EscalationRule[] = [
  { level: 'low',      repeatCount: 1,  cooldownMs: 60_000 },
  { level: 'medium',   repeatCount: 3,  cooldownMs: 30_000 },
  { level: 'high',     repeatCount: 5,  cooldownMs: 15_000 },
  { level: 'critical', repeatCount: 8,  cooldownMs: 5_000  },
];

export function createEscalationStore(rules: EscalationRule[] = DEFAULT_RULES): EscalationStore {
  return { entries: {}, rules };
}

export function escalationKey(port: number, protocol: string): string {
  return `${protocol}:${port}`;
}

export function recordEscalation(
  store: EscalationStore,
  key: string,
  now: number = Date.now()
): EscalationEntry {
  const existing = store.entries[key];
  const count = existing ? existing.count + 1 : 1;
  const level = resolveLevel(store.rules, count);
  const entry: EscalationEntry = { key, level, count, lastEscalatedAt: now };
  store.entries[key] = entry;
  return entry;
}

export function shouldEscalate(
  store: EscalationStore,
  key: string,
  now: number = Date.now()
): boolean {
  const entry = store.entries[key];
  if (!entry) return true;
  const rule = store.rules.find(r => r.level === entry.level);
  if (!rule) return true;
  return now - entry.lastEscalatedAt >= rule.cooldownMs;
}

export function resetEscalation(store: EscalationStore, key: string): void {
  delete store.entries[key];
}

export function purgeEscalationEntries(
  store: EscalationStore,
  maxAgeMs: number,
  now: number = Date.now()
): number {
  let removed = 0;
  for (const key of Object.keys(store.entries)) {
    if (now - store.entries[key].lastEscalatedAt > maxAgeMs) {
      delete store.entries[key];
      removed++;
    }
  }
  return removed;
}

function resolveLevel(rules: EscalationRule[], count: number): EscalationLevel {
  let level: EscalationLevel = 'low';
  for (const rule of rules) {
    if (count >= rule.repeatCount) level = rule.level;
  }
  return level;
}
