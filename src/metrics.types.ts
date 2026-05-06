export interface PortMetrics {
  port: number;
  protocol: string;
  process: string;
  scanCount: number;
  firstSeen: number;
  lastSeen: number;
  alertCount: number;
}

export interface MetricsStore {
  entries: Record<string, PortMetrics>;
  createdAt: number;
  updatedAt: number;
}

export interface MetricsSummary {
  totalPorts: number;
  totalAlerts: number;
  mostActivePort: PortMetrics | null;
  mostAlertedPort: PortMetrics | null;
  timeRangeMs: number;
}
