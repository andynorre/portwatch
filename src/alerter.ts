import { PortDiff } from './baseline';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  severity: AlertSeverity;
  message: string;
  port: number;
  pid?: number;
  process?: string;
  timestamp: Date;
}

export interface AlerterOptions {
  criticalPorts?: number[];
  onAlert?: (alert: Alert) => void;
}

const DEFAULT_CRITICAL_PORTS = [22, 80, 443, 3306, 5432, 6379, 27017];

export function buildAlerts(diff: PortDiff, options: AlerterOptions = {}): Alert[] {
  const criticalPorts = options.criticalPorts ?? DEFAULT_CRITICAL_PORTS;
  const alerts: Alert[] = [];
  const now = new Date();

  for (const entry of diff.added) {
    const isCritical = criticalPorts.includes(entry.port);
    const alert: Alert = {
      severity: isCritical ? 'critical' : 'warning',
      message: `New port binding detected: ${entry.port}/${entry.protocol} (${entry.process ?? 'unknown'})`,
      port: entry.port,
      pid: entry.pid,
      process: entry.process,
      timestamp: now,
    };
    alerts.push(alert);
    options.onAlert?.(alert);
  }

  for (const entry of diff.removed) {
    const alert: Alert = {
      severity: 'info',
      message: `Port no longer bound: ${entry.port}/${entry.protocol} (${entry.process ?? 'unknown'})`,
      port: entry.port,
      pid: entry.pid,
      process: entry.process,
      timestamp: now,
    };
    alerts.push(alert);
    options.onAlert?.(alert);
  }

  return alerts;
}

export function formatAlert(alert: Alert): string {
  const ts = alert.timestamp.toISOString();
  const level = alert.severity.toUpperCase().padEnd(8);
  return `[${ts}] ${level} ${alert.message}`;
}
