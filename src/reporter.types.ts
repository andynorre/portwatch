export type ReportFormat = 'text' | 'json';

export interface ReportOptions {
  outputDir?: string;
  format?: ReportFormat;
  timestamp?: Date;
}

export interface Report {
  generatedAt: string;
  alertCount: number;
  alerts: import('./alerter').PortAlert[];
  summary: string;
}
