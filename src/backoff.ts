/**
 * Exponential backoff utility for retry logic in portwatch.
 * Used by the watcher and scheduler to back off on repeated failures.
 */

export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
  multiplier: number;
  jitter: boolean;
}

export interface BackoffState {
  attempt: number;
  lastDelayMs: number;
  totalWaitedMs: number;
}

const DEFAULT_OPTIONS: BackoffOptions = {
  baseMs: 500,
  maxMs: 30_000,
  multiplier: 2,
  jitter: true,
};

export function createBackoffState(): BackoffState {
  return { attempt: 0, lastDelayMs: 0, totalWaitedMs: 0 };
}

export function computeDelay(
  state: BackoffState,
  options: Partial<BackoffOptions> = {}
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const raw = Math.min(
    opts.baseMs * Math.pow(opts.multiplier, state.attempt),
    opts.maxMs
  );
  if (!opts.jitter) return raw;
  // Full jitter: random value in [0, raw]
  return Math.floor(Math.random() * (raw + 1));
}

export function advanceBackoff(
  state: BackoffState,
  options: Partial<BackoffOptions> = {}
): BackoffState {
  const delay = computeDelay(state, options);
  return {
    attempt: state.attempt + 1,
    lastDelayMs: delay,
    totalWaitedMs: state.totalWaitedMs + delay,
  };
}

export function resetBackoff(): BackoffState {
  return createBackoffState();
}

export function hasExceededMaxAttempts(
  state: BackoffState,
  maxAttempts: number
): boolean {
  return state.attempt >= maxAttempts;
}
