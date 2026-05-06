export interface HistoryEntry {
  timestamp: number;
  checksum: string;
  alertCount: number;
  ports: string[];
}

export interface HistoryStore {
  entries: HistoryEntry[];
  maxEntries: number;
  filePath: string;
}
