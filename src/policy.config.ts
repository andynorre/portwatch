import type { PolicyStore, PolicyAction } from './policy.types';
import { createPolicyStore, addPolicyRule } from './policy';

export interface PolicyConfig {
  defaultAction?: PolicyAction;
  rules?: Array<{
    id: string;
    name: string;
    field: 'port' | 'protocol' | 'process' | 'user';
    pattern: string | number;
    action: PolicyAction;
    priority?: number;
    enabled?: boolean;
  }>;
}

export function buildPolicyStore(config: PolicyConfig): PolicyStore {
  let store = createPolicyStore(config.defaultAction ?? 'alert');
  if (!config.rules) return store;
  for (const rule of config.rules) {
    store = addPolicyRule(store, {
      id: rule.id,
      name: rule.name,
      field: rule.field,
      pattern: rule.pattern,
      action: rule.action,
      priority: rule.priority ?? 0,
      enabled: rule.enabled ?? true,
    });
  }
  return store;
}

export function validatePolicyConfig(config: unknown): config is PolicyConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  if (c.defaultAction !== undefined && !['allow', 'deny', 'alert'].includes(c.defaultAction as string)) {
    return false;
  }
  if (c.rules !== undefined && !Array.isArray(c.rules)) return false;
  return true;
}
