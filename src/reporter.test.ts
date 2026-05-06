import { buildReport, formatReport, saveReport } from './reporter';
import { PortAlert } from './alerter';
import * as fs from 'fs';
import * as path from 'path';

const mockAlerts: PortAlert[] = [
  { port: 4444, protocol: 'tcp', process: 'unknown', pid: 999, severity: 'high', message: 'Unexpected binding on port 4444' },
];

describe('buildReport', () => {
  it('returns zero-alert report when alerts array is empty', () => {
    const report = buildReport([]);
    expect(report.alertCount).toBe(0);
    expect(report.summary).toMatch(/No unexpected/);
    expect(report.alerts).toHaveLength(0);
  });

  it('includes alert count and summary when alerts present', () => {
    const report = buildReport(mockAlerts);
    expect(report.alertCount).toBe(1);
    expect(report.summary).toMatch(/1 unexpected/);
  });

  it('uses provided timestamp', () => {
    const ts = new Date('2024-01-15T10:00:00Z');
    const report = buildReport([], { timestamp: ts });
    expect(report.generatedAt).toBe('2024-01-15T10:00:00.000Z');
  });
});

describe('formatReport', () => {
  it('formats as JSON when format is json', () => {
    const report = buildReport(mockAlerts);
    const output = formatReport(report, 'json');
    const parsed = JSON.parse(output);
    expect(parsed.alertCount).toBe(1);
  });

  it('formats as human-readable text by default', () => {
    const report = buildReport(mockAlerts);
    const output = formatReport(report);
    expect(output).toContain('PortWatch Report');
    expect(output).toContain('Alerts:');
    expect(output).toContain('4444');
  });

  it('shows no-alert message in text format when empty', () => {
    const report = buildReport([]);
    const output = formatReport(report, 'text');
    expect(output).toContain('No unexpected');
    expect(output).not.toContain('Alerts:');
  });
});

describe('saveReport', () => {
  const testDir = './test-reports-tmp';

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('creates output directory if it does not exist', () => {
    const report = buildReport([]);
    saveReport(report, { outputDir: testDir });
    expect(fs.existsSync(testDir)).toBe(true);
  });

  it('writes a .json file when format is json', () => {
    const report = buildReport(mockAlerts);
    const filepath = saveReport(report, { outputDir: testDir, format: 'json' });
    expect(filepath).toMatch(/\.json$/);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(JSON.parse(content).alertCount).toBe(1);
  });

  it('writes a .txt file when format is text', () => {
    const report = buildReport([]);
    const filepath = saveReport(report, { outputDir: testDir, format: 'text' });
    expect(filepath).toMatch(/\.txt$/);
  });
});
