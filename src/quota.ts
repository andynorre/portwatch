import { QuotaStore, QuotaRule, QuotaEntry, QuotaCheckResult } from './quota.types';
import { PortInfo } from './scanner';

export function createQuotaStore(): QuotaStore {
  return {
    rules: new Map(),
    entries: new Map(),
  };
}

export function registerQuotaRule(store: QuotaStore, rule: QuotaRule): void {
  store.rules.set(rule.id, rule);
}

export function removeQuotaRule(store: QuotaStore, ruleId: string): boolean {
  return store.rules.delete(ruleId);
}

export function quotaEntryKey(ruleId: string, scopeValue: string): string {
  return `${ruleId}::${scopeValue}`;
}

export function checkQuota(
  store: QuotaStore,
  port: PortInfo,
  now: number = Date.now()
): QuotaCheckResult[] {
  const results: QuotaCheckResult[] = [];

  for (const rule of store.rules.values()) {
    const scopeValue =
      rule.scope === 'global'
        ? '__global__'
        : rule.scope === 'process'
        ? (port.process ?? '__unknown__')
        : (port.user ?? '__unknown__');

    const key = quotaEntryKey(rule.id, scopeValue);
    let entry = store.entries.get(key);

    if (!entry || now - entry.windowStart >= rule.windowMs) {
      entry = {
        ruleId: rule.id,
        scope: rule.scope,
        scopeValue,
        count: 0,
        windowStart: now,
      };
      store.entries.set(key, entry);
    }

    entry.count += 1;

    results.push({
      allowed: entry.count <= rule.maxPorts,
      ruleId: rule.id,
      current: entry.count,
      max: rule.maxPorts,
      resetsAt: entry.windowStart + rule.windowMs,
    });
  }

  return results;
}

export function resetQuota(store: QuotaStore, ruleId: string, scopeValue: string): void {
  const key = quotaEntryKey(ruleId, scopeValue);
  store.entries.delete(key);
}

export function purgeExpiredQuotas(store: QuotaStore, now: number = Date.now()): number {
  let removed = 0;
  for (const [key, entry] of store.entries) {
    const rule = store.rules.get(entry.ruleId);
    if (!rule || now - entry.windowStart >= rule.windowMs) {
      store.entries.delete(key);
      removed++;
    }
  }
  return removed;
}
