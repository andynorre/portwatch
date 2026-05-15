export type PolicyAction = 'allow' | 'deny' | 'alert';

export type PolicyMatchField = 'port' | 'protocol' | 'process' | 'user';

export interface PolicyRule {
  id: string;
  name: string;
  field: PolicyMatchField;
  pattern: string | number;
  action: PolicyAction;
  priority: number;
  enabled: boolean;
  createdAt: number;
}

export interface PolicyStore {
  rules: PolicyRule[];
  defaultAction: PolicyAction;
}

export interface PolicyResult {
  ruleId: string | null;
  ruleName: string | null;
  action: PolicyAction;
  matched: boolean;
}
