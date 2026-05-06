import * as fs from 'fs';
import * as path from 'path';
import { AuditEntry, AuditLog, AuditSeverity } from './audit.types';

const DEFAULT_AUDIT_PATH = path.join(process.cwd(), 'portwatch-audit.json');

export function createAuditLog(): AuditLog {
  return {
    entries: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addAuditEntry(
  log: AuditLog,
  event: string,
  severity: AuditSeverity,
  meta?: Partial<Omit<AuditEntry, 'timestamp' | 'event' | 'severity'>>
): AuditLog {
  const entry: AuditEntry = {
    timestamp: Date.now(),
    event,
    severity,
    ...meta,
  };
  return {
    ...log,
    entries: [...log.entries, entry],
    updatedAt: Date.now(),
  };
}

export function saveAuditLog(
  log: AuditLog,
  filePath: string = DEFAULT_AUDIT_PATH
): void {
  fs.writeFileSync(filePath, JSON.stringify(log, null, 2), 'utf-8');
}

export function loadAuditLog(filePath: string = DEFAULT_AUDIT_PATH): AuditLog {
  if (!fs.existsSync(filePath)) {
    return createAuditLog();
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as AuditLog;
}

export function getEntriesBySeverity(
  log: AuditLog,
  severity: AuditSeverity
): AuditEntry[] {
  return log.entries.filter((e) => e.severity === severity);
}

export function pruneAuditLog(log: AuditLog, maxEntries: number): AuditLog {
  if (log.entries.length <= maxEntries) return log;
  return {
    ...log,
    entries: log.entries.slice(log.entries.length - maxEntries),
    updatedAt: Date.now(),
  };
}
