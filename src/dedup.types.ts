export interface DedupEntry {
  key: string;
  firstSeen: number;
  lastSeen: number;
  count: number;
}

export interface DedupStore {
  entries: Record<string, DedupEntry>;
  windowMs: number;
}
