import { SchedulerConfig, SchedulerState, SchedulerCallback } from './scheduler.types';

let timer: ReturnType<typeof setInterval> | null = null;
let state: SchedulerState = {
  running: false,
  runCount: 0,
  lastRunAt: null,
  nextRunAt: null,
};

export function startScheduler(
  callback: SchedulerCallback,
  config: SchedulerConfig
): void {
  if (state.running) {
    throw new Error('Scheduler is already running');
  }

  const { intervalMs, immediate = false, maxRuns } = config;

  if (intervalMs <= 0) {
    throw new Error('intervalMs must be a positive number');
  }

  state.running = true;
  state.runCount = 0;
  state.nextRunAt = new Date(Date.now() + (immediate ? 0 : intervalMs));

  const tick = async () => {
    if (maxRuns !== undefined && state.runCount >= maxRuns) {
      stopScheduler();
      return;
    }

    state.lastRunAt = new Date();
    state.runCount += 1;
    state.nextRunAt = new Date(Date.now() + intervalMs);

    try {
      await callback();
    } catch (err) {
      console.error('[scheduler] callback error:', err);
    }
  };

  if (immediate) {
    tick();
  }

  timer = setInterval(tick, intervalMs);
}

export function stopScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  state.running = false;
  state.nextRunAt = null;
}

export function getSchedulerState(): Readonly<SchedulerState> {
  return { ...state };
}

export function resetScheduler(): void {
  stopScheduler();
  state = {
    running: false,
    runCount: 0,
    lastRunAt: null,
    nextRunAt: null,
  };
}
