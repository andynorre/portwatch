import { createRetryState, computeRetryDelay, withRetry, buildRetryOptions } from './retry';
import { RetryOptions } from './retry.types';

const deterministicOpts: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  factor: 2,
  jitter: false,
};

describe('createRetryState', () => {
  it('returns a fresh state', () => {
    const state = createRetryState();
    expect(state.attempts).toBe(0);
    expect(state.lastError).toBeNull();
    expect(state.succeeded).toBe(false);
  });
});

describe('computeRetryDelay', () => {
  it('returns base delay on first retry', () => {
    expect(computeRetryDelay(0, deterministicOpts)).toBe(100);
  });

  it('doubles on subsequent retries', () => {
    expect(computeRetryDelay(1, deterministicOpts)).toBe(200);
    expect(computeRetryDelay(2, deterministicOpts)).toBe(400);
  });

  it('caps at maxDelayMs', () => {
    expect(computeRetryDelay(20, deterministicOpts)).toBe(5000);
  });

  it('applies jitter when enabled', () => {
    const opts = { ...deterministicOpts, jitter: true };
    const delay = computeRetryDelay(0, opts);
    expect(delay).toBeGreaterThanOrEqual(50);
    expect(delay).toBeLessThanOrEqual(100);
  });
});

describe('withRetry', () => {
  it('returns ok result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('data');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, jitter: false });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('data');
      expect(result.attempts).toBe(1);
    }
  });

  it('retries on failure and succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, jitter: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.attempts).toBe(2);
  });

  it('returns error result after exhausting attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, jitter: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('always fails');
      expect(result.attempts).toBe(3);
    }
  });
});

describe('buildRetryOptions', () => {
  it('merges overrides with defaults', () => {
    const opts = buildRetryOptions({ maxAttempts: 5, jitter: false });
    expect(opts.maxAttempts).toBe(5);
    expect(opts.jitter).toBe(false);
    expect(opts.baseDelayMs).toBe(100);
  });
});
