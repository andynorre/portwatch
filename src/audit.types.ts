export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  timestamp: number;
  event: string;
  severity: AuditSeverity;
  port?: number;
  protocol?: string;
  process?: string;
  details?: string;
}

export interface AuditLog {
  entries: AuditEntry[];
  createdAt: number;
  updatedAt: number;
}
