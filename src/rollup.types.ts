export interface RollupEntry {
  port: number;
  protocol: string;
  process: string;
  alertCount: number;
  firstSeen: number;
  lastSeen: number;
  severities: string[];
}

export interface RollupStore {
  entries: Record<string, RollupEntry>;
  windowMs: number;
  createdAt: number;
  updatedAt: number;
}

export interface RollupSummary {
  totalPorts: number;
  totalAlerts: number;
  topPorts: RollupEntry[];
  windowMs: number;
  generatedAt: number;
}
