export interface CheckpointEntry {
  id: string;
  timestamp: number;
  portCount: number;
  checksum: string;
  label?: string;
}

export interface CheckpointStore {
  entries: CheckpointEntry[];
  maxEntries: number;
}
