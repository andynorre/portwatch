export interface SnapshotMeta {
  filePath: string;
  timestamp: number;
  portCount: number;
  checksum: string;
}

export interface SnapshotDiff {
  added: import('./scanner').PortEntry[];
  removed: import('./scanner').PortEntry[];
  unchanged: number;
  hasChanges: boolean;
}
