import { WatchdogConfig } from './watchdog.types';

export interface RawWatchdogConfig {
  intervalMs?: number;
  maxMissed?: number;
}

const DEFAULTS: Required<RawWatchdogConfig> = {
  intervalMs: 5000,
  maxMissed: 3,
};

export function buildWatchdogConfig(
  raw: RawWatchdogConfig = {},
  hooks: Pick<WatchdogConfig, 'onDegraded' | 'onFailed' | 'onRecovered'> = {}
): WatchdogConfig {
  const intervalMs = raw.intervalMs ?? DEFAULTS.intervalMs;
  const maxMissed = raw.maxMissed ?? DEFAULTS.maxMissed;

  if (intervalMs < 500) {
    throw new Error('watchdog intervalMs must be at least 500ms');
  }
  if (maxMissed < 1) {
    throw new Error('watchdog maxMissed must be at least 1');
  }

  return {
    intervalMs,
    maxMissed,
    ...hooks,
  };
}
