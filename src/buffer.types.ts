export interface BufferedAlert {
  id: string;
  timestamp: number;
  port: number;
  protocol: string;
  process: string;
  message: string;
  severity: string;
}

export interface BufferStore {
  entries: BufferedAlert[];
  maxSize: number;
  flushIntervalMs: number;
  lastFlushedAt: number;
}

export interface BufferSummary {
  count: number;
  oldestAt: number | null;
  newestAt: number | null;
  severityCounts: Record<string, number>;
}
