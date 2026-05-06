import * as fs from 'fs';
import { SuppressionRule, SuppressionStore } from './suppression.types';
import { PortEntry } from './scanner';

const DEFAULT_PATH = './suppression.json';

export function createSuppressionStore(): SuppressionStore {
  return { rules: [] };
}

export function addRule(
  store: SuppressionStore,
  rule: Omit<SuppressionRule, 'id' | 'createdAt'>
): SuppressionStore {
  const newRule: SuppressionRule = {
    ...rule,
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  return { rules: [...store.rules, newRule] };
}

export function removeRule(store: SuppressionStore, id: string): SuppressionStore {
  return { rules: store.rules.filter((r) => r.id !== id) };
}

export function purgeExpired(store: SuppressionStore): SuppressionStore {
  const now = Date.now();
  return {
    rules: store.rules.filter((r) => r.expiresAt === undefined || r.expiresAt > now),
  };
}

export function isSuppressed(store: SuppressionStore, entry: PortEntry): boolean {
  const active = purgeExpired(store);
  return active.rules.some((rule) => {
    if (rule.protocol && rule.protocol !== entry.protocol) return false;
    if (rule.process && entry.process && !entry.process.includes(rule.process)) return false;
    if (rule.port !== undefined && rule.port !== entry.port) return false;
    if (rule.portRange) {
      const [lo, hi] = rule.portRange;
      if (entry.port < lo || entry.port > hi) return false;
    }
    return true;
  });
}

export function saveSuppressionStore(
  store: SuppressionStore,
  filePath: string = DEFAULT_PATH
): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function loadSuppressionStore(filePath: string = DEFAULT_PATH): SuppressionStore {
  if (!fs.existsSync(filePath)) return createSuppressionStore();
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SuppressionStore;
}
