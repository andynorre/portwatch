export interface QuotaRule {
  id: string;
  maxPorts: number;
  windowMs: number;
  scope: 'global' | 'process' | 'user';
  scopeValue?: string;
}

export interface QuotaEntry {
  ruleId: string;
  scope: 'global' | 'process' | 'user';
  scopeValue: string;
  count: number;
  windowStart: number;
}

export interface QuotaStore {
  rules: Map<string, QuotaRule>;
  entries: Map<string, QuotaEntry>;
}

export interface QuotaCheckResult {
  allowed: boolean;
  ruleId: string;
  current: number;
  max: number;
  resetsAt: number;
}
