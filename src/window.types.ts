export interface TimeWindow {
  start: number;
  end: number;
  durationMs: number;
}

export interface WindowEntry {
  key: string;
  windowStart: number;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

export interface WindowStore {
  windowMs: number;
  entries: Map<string, WindowEntry>;
}

export interface WindowSummary {
  key: string;
  count: number;
  windowMs: number;
  firstSeen: number;
  lastSeen: number;
  rate: number; // events per second
}
