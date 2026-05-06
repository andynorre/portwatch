export interface WatcherState {
  running: boolean;
  tickCount: number;
  lastScan: Date | null;
}

export interface WatcherOptions {
  configPath?: string;
  intervalSeconds?: number;
}
