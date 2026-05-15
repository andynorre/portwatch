import type { PolicyStore, PolicyRule, PolicyResult, PolicyAction, PolicyMatchField } from './policy.types';
import type { PortInfo } from './baseline.types';

export function createPolicyStore(defaultAction: PolicyAction = 'alert'): PolicyStore {
  return { rules: [], defaultAction };
}

export function addPolicyRule(store: PolicyStore, rule: Omit<PolicyRule, 'createdAt'>): PolicyStore {
  const newRule: PolicyRule = { ...rule, createdAt: Date.now() };
  const rules = [...store.rules, newRule].sort((a, b) => b.priority - a.priority);
  return { ...store, rules };
}

export function removePolicyRule(store: PolicyStore, id: string): PolicyStore {
  return { ...store, rules: store.rules.filter(r => r.id !== id) };
}

export function togglePolicyRule(store: PolicyStore, id: string, enabled: boolean): PolicyStore {
  return {
    ...store,
    rules: store.rules.map(r => r.id === id ? { ...r, enabled } : r),
  };
}

function matchesRule(rule: PolicyRule, port: PortInfo): boolean {
  if (!rule.enabled) return false;
  const field: PolicyMatchField = rule.field;
  switch (field) {
    case 'port':
      return port.port === Number(rule.pattern);
    case 'protocol':
      return port.protocol === String(rule.pattern);
    case 'process':
      return typeof rule.pattern === 'string' && (port.process ?? '').includes(rule.pattern);
    case 'user':
      return typeof rule.pattern === 'string' && (port.user ?? '').includes(rule.pattern);
    default:
      return false;
  }
}

export function evaluatePolicy(store: PolicyStore, port: PortInfo): PolicyResult {
  for (const rule of store.rules) {
    if (matchesRule(rule, port)) {
      return { ruleId: rule.id, ruleName: rule.name, action: rule.action, matched: true };
    }
  }
  return { ruleId: null, ruleName: null, action: store.defaultAction, matched: false };
}

export function evaluatePolicies(store: PolicyStore, ports: PortInfo[]): Map<PortInfo, PolicyResult> {
  const results = new Map<PortInfo, PolicyResult>();
  for (const port of ports) {
    results.set(port, evaluatePolicy(store, port));
  }
  return results;
}
