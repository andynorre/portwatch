export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
}

export interface RetryState {
  attempts: number;
  lastAttemptAt: number | null;
  lastError: string | null;
  succeeded: boolean;
}

export type RetryResult<T> =
  | { ok: true; value: T; attempts: number }
  | { ok: false; error: string; attempts: number };
