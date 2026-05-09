export interface CorrelationEvent {
  id: string;
  port: number;
  protocol: string;
  process: string;
  timestamp: number;
  severity: string;
}

export interface CorrelationGroup {
  key: string;
  events: CorrelationEvent[];
  firstSeen: number;
  lastSeen: number;
  count: number;
}

export interface CorrelationStore {
  groups: Record<string, CorrelationGroup>;
  windowMs: number;
}
