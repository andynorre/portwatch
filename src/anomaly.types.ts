export type AnomalyKind =
  | 'new_port'
  | 'port_closed'
  | 'process_changed'
  | 'user_changed'
  | 'protocol_changed';

export interface Anomaly {
  kind: AnomalyKind;
  port: number;
  protocol: string;
  previous?: string;
  current?: string;
  detectedAt: number;
}

export interface AnomalyStore {
  anomalies: Anomaly[];
  lastEvaluatedAt: number | null;
}
