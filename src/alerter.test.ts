import { buildAlerts, formatAlert, Alert } from './alerter';
import { PortDiff } from './baseline';

const makeEntry = (port: number, protocol: 'tcp' | 'udp' = 'tcp', process = 'node', pid = 1234) => ({
  port,
  protocol,
  process,
  pid,
});

describe('buildAlerts', () => {
  it('returns empty array when there are no changes', () => {
    const diff: PortDiff = { added: [], removed: [] };
    expect(buildAlerts(diff)).toEqual([]);
  });

  it('creates a warning alert for a new non-critical port', () => {
    const diff: PortDiff = { added: [makeEntry(8080)], removed: [] };
    const alerts = buildAlerts(diff);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('warning');
    expect(alerts[0].port).toBe(8080);
  });

  it('creates a critical alert for a new critical port', () => {
    const diff: PortDiff = { added: [makeEntry(22)], removed: [] };
    const alerts = buildAlerts(diff);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
  });

  it('creates an info alert for a removed port', () => {
    const diff: PortDiff = { added: [], removed: [makeEntry(9000)] };
    const alerts = buildAlerts(diff);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('info');
    expect(alerts[0].port).toBe(9000);
  });

  it('respects custom critical ports list', () => {
    const diff: PortDiff = { added: [makeEntry(9999)], removed: [] };
    const alerts = buildAlerts(diff, { criticalPorts: [9999] });
    expect(alerts[0].severity).toBe('critical');
  });

  it('calls onAlert callback for each alert', () => {
    const diff: PortDiff = { added: [makeEntry(3000)], removed: [makeEntry(4000)] };
    const received: Alert[] = [];
    buildAlerts(diff, { onAlert: (a) => received.push(a) });
    expect(received).toHaveLength(2);
  });

  it('includes process name and pid in the generated alert', () => {
    const diff: PortDiff = { added: [makeEntry(8080, 'tcp', 'nginx', 5678)], removed: [] };
    const alerts = buildAlerts(diff);
    expect(alerts[0].process).toBe('nginx');
    expect(alerts[0].pid).toBe(5678);
  });

  it('handles udp protocol entries correctly', () => {
    const diff: PortDiff = { added: [makeEntry(53, 'udp', 'dnsmasq', 101)], removed: [] };
    const alerts = buildAlerts(diff);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].port).toBe(53);
  });
});

describe('formatAlert', () => {
  it('formats an alert as a readable string', () => {
    const alert: Alert = {
      severity: 'critical',
      message: 'New port binding detected: 22/tcp (sshd)',
      port: 22,
      pid: 999,
      process: 'sshd',
      timestamp: new Date('2024-01-15T10:00:00.000Z'),
    };
    const result = formatAlert(alert);
    expect(result).toContain('2024-01-15T10:00:00.000Z');
    expect(result).toContain('CRITICAL');
    expect(result).toContain('22/tcp');
  });

  it('formats a warning alert with correct severity label', () => {
    const alert: Alert = {
      severity: 'warning',
      message: 'New port binding detected: 8080/tcp (node)',
      port: 8080,
      pid: 1234,
      process: 'node',
      timestamp: new Date('2024-01-15T12:00:00.000Z'),
    };
    const result = formatAlert(alert);
    expect(result).toContain('WARNING');
    expect(result).toContain('8080/tcp');
  });
});
