export interface SchedulerConfig {
  intervalMs: number;
  immediate?: boolean;
  maxRuns?: number;
}

export interface SchedulerState {
  running: boolean;
  runCount: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}

export type SchedulerCallback = () => Promise<void> | void;
