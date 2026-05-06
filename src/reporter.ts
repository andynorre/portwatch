import { PortAlert } from './alerter';
import { formatAlert } from './alerter';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportOptions {
  outputDir?: string;
  format?: 'text' | 'json';
  timestamp?: Date;
}

export interface Report {
  generatedAt: string;
  alertCount: number;
  alerts: PortAlert[];
  summary: string;
}

export function buildReport(alerts: PortAlert[], options: ReportOptions = {}): Report {
  const timestamp = options.timestamp ?? new Date();
  const summary =
    alerts.length === 0
      ? 'No unexpected port bindings detected.'
      : `${alerts.length} unexpected port binding(s) detected.`;

  return {
    generatedAt: timestamp.toISOString(),
    alertCount: alerts.length,
    alerts,
    summary,
  };
}

export function formatReport(report: Report, format: 'text' | 'json' = 'text'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  const lines: string[] = [
    `PortWatch Report — ${report.generatedAt}`,
    `Summary: ${report.summary}`,
    '',
  ];

  if (report.alerts.length > 0) {
    lines.push('Alerts:');
    for (const alert of report.alerts) {
      lines.push(`  ${formatAlert(alert)}`);
    }
  }

  return lines.join('\n');
}

export function saveReport(report: Report, options: ReportOptions = {}): string {
  const outputDir = options.outputDir ?? './reports';
  const format = options.format ?? 'text';
  const ext = format === 'json' ? 'json' : 'txt';
  const filename = `portwatch-${Date.now()}.${ext}`;
  const filepath = path.join(outputDir, filename);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(filepath, formatReport(report, format), 'utf-8');
  return filepath;
}
