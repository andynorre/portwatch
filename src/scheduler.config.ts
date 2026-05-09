import { SchedulerConfig } from './scheduler.types';

export interface BuildSchedulerConfigOptions {
  intervalMs?: number;
  maxMissedTicks?: number;
  jitterMs?: number;
  enableTrend?: boolean;
  trendWindowMs?: number;
  trendMaxPoints?: number;
}

const DEFAULTS: Required<BuildSchedulerConfigOptions> = {
  intervalMs: 30_000,
  maxMissedTicks: 3,
  jitterMs: 0,
  enableTrend: true,
  trendWindowMs: 5 * 60 * 1000,
  trendMaxPoints: 60,
};

export function buildSchedulerConfig(
  options: BuildSchedulerConfigOptions = {}
): SchedulerConfig & {
  enableTrend: boolean;
  trendWindowMs: number;
  trendMaxPoints: number;
} {
  const merged = { ...DEFAULTS, ...options };

  if (merged.intervalMs < 1000) {
    throw new Error('intervalMs must be at least 1000ms');
  }
  if (merged.maxMissedTicks < 1) {
    throw new Error('maxMissedTicks must be at least 1');
  }
  if (merged.trendMaxPoints < 2) {
    throw new Error('trendMaxPoints must be at least 2');
  }

  return {
    intervalMs: merged.intervalMs,
    maxMissedTicks: merged.maxMissedTicks,
    jitterMs: merged.jitterMs,
    enableTrend: merged.enableTrend,
    trendWindowMs: merged.trendWindowMs,
    trendMaxPoints: merged.trendMaxPoints,
  };
}
