import { RetryOptions, RetryState, RetryResult } from './retry.types';

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  factor: 2,
  jitter: true,
};

export function createRetryState(): RetryState {
  return {
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
    succeeded: false,
  };
}

export function computeRetryDelay(attempt: number, opts: RetryOptions): number {
  const exp = Math.min(opts.baseDelayMs * Math.pow(opts.factor, attempt), opts.maxDelayMs);
  if (!opts.jitter) return exp;
  return Math.floor(exp * (0.5 + Math.random() * 0.5));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError = 'Unknown error';

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = computeRetryDelay(attempt - 1, opts);
      await new Promise((res) => setTimeout(res, delay));
    }
    try {
      const value = await fn();
      return { ok: true, value, attempts: attempt + 1 };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { ok: false, error: lastError, attempts: opts.maxAttempts };
}

export function buildRetryOptions(overrides: Partial<RetryOptions> = {}): RetryOptions {
  return { ...DEFAULT_OPTIONS, ...overrides };
}
