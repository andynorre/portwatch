import { EscalationRule, EscalationLevel } from './escalation.types';

export interface EscalationConfig {
  enabled: boolean;
  rules: EscalationRule[];
  maxEntryAgeMs: number;
}

const LEVEL_ORDER: EscalationLevel[] = ['low', 'medium', 'high', 'critical'];

export function buildEscalationConfig(
  overrides: Partial<EscalationConfig> = {}
): EscalationConfig {
  const defaults: EscalationConfig = {
    enabled: true,
    maxEntryAgeMs: 3_600_000, // 1 hour
    rules: [
      { level: 'low',      repeatCount: 1,  cooldownMs: 60_000 },
      { level: 'medium',   repeatCount: 3,  cooldownMs: 30_000 },
      { level: 'high',     repeatCount: 5,  cooldownMs: 15_000 },
      { level: 'critical', repeatCount: 8,  cooldownMs: 5_000  },
    ],
  };
  const merged = { ...defaults, ...overrides };
  merged.rules = validateAndSortRules(merged.rules);
  return merged;
}

export function validateAndSortRules(rules: EscalationRule[]): EscalationRule[] {
  for (const rule of rules) {
    if (!LEVEL_ORDER.includes(rule.level)) {
      throw new Error(`Invalid escalation level: ${rule.level}`);
    }
    if (rule.repeatCount < 1) {
      throw new Error(`repeatCount must be >= 1 for level ${rule.level}`);
    }
    if (rule.cooldownMs < 0) {
      throw new Error(`cooldownMs must be >= 0 for level ${rule.level}`);
    }
  }
  return [...rules].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );
}
