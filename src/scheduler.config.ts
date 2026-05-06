import { SchedulerConfig } from './scheduler.types';
import { loadConfig } from './config';

const DEFAULT_INTERVAL_MS = 30_000;
const MIN_INTERVAL_MS = 1_000;
const MAX_INTERVAL_MS = 3_600_000;

export function buildSchedulerConfig(configPath?: string): SchedulerConfig {
  let intervalMs = DEFAULT_INTERVAL_MS;
  let immediate = false;

  try {
    const cfg = loadConfig(configPath);
    if (typeof cfg.intervalSeconds === 'number') {
      intervalMs = cfg.intervalSeconds * 1000;
    }
    if (typeof cfg.immediate === 'boolean') {
      immediate = cfg.immediate;
    }
  } catch {
    // fall back to defaults if config is unavailable
  }

  if (intervalMs < MIN_INTERVAL_MS) {
    console.warn(
      `[scheduler] intervalMs ${intervalMs} is below minimum; using ${MIN_INTERVAL_MS}ms`
    );
    intervalMs = MIN_INTERVAL_MS;
  }

  if (intervalMs > MAX_INTERVAL_MS) {
    console.warn(
      `[scheduler] intervalMs ${intervalMs} exceeds maximum; using ${MAX_INTERVAL_MS}ms`
    );
    intervalMs = MAX_INTERVAL_MS;
  }

  return { intervalMs, immediate };
}

export { DEFAULT_INTERVAL_MS, MIN_INTERVAL_MS, MAX_INTERVAL_MS };
