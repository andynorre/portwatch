export type WatchdogStatus = 'healthy' | 'degraded' | 'failed';

export interface WatchdogState {
  lastHeartbeat: number;
  missedBeats: number;
  status: WatchdogStatus;
  startedAt: number;
  intervalMs: number;
  maxMissed: number;
}

export interface WatchdogConfig {
  intervalMs: number;
  maxMissed: number;
  onDegraded?: (state: WatchdogState) => void;
  onFailed?: (state: WatchdogState) => void;
  onRecovered?: (state: WatchdogState) => void;
}
