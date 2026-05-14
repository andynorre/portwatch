export type EscalationLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EscalationRule {
  level: EscalationLevel;
  repeatCount: number;  // how many consecutive alerts before escalating
  cooldownMs: number;   // minimum ms between escalated notifications
}

export interface EscalationEntry {
  key: string;
  level: EscalationLevel;
  count: number;
  lastEscalatedAt: number;
}

export interface EscalationStore {
  entries: Record<string, EscalationEntry>;
  rules: EscalationRule[];
}
