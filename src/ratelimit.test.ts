import {
  checkRateLimit,
  registerRule,
  resetRateLimit,
  getRateLimitStore,
  purgeExpiredRateLimits,
} from './ratelimit';

beforeEach(() => {
  resetRateLimit();
});

describe('checkRateLimit', () => {
  it('allows events when no rule is registered', () => {
    const result = checkRateLimit('unknown-key');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it('allows first event within limit', () => {
    registerRule({ key: 'alert:22', maxEvents: 3, windowMs: 60000 });
    const result = checkRateLimit('alert:22', 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks events exceeding maxEvents in window', () => {
    registerRule({ key: 'alert:80', maxEvents: 2, windowMs: 60000 });
    checkRateLimit('alert:80', 1000);
    checkRateLimit('alert:80', 2000);
    const result = checkRateLimit('alert:80', 3000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets window after windowMs elapsed', () => {
    registerRule({ key: 'alert:443', maxEvents: 1, windowMs: 5000 });
    checkRateLimit('alert:443', 1000);
    const blocked = checkRateLimit('alert:443', 2000);
    expect(blocked.allowed).toBe(false);
    const reset = checkRateLimit('alert:443', 7000);
    expect(reset.allowed).toBe(true);
  });

  it('returns correct resetAt timestamp', () => {
    registerRule({ key: 'alert:8080', maxEvents: 5, windowMs: 10000 });
    const result = checkRateLimit('alert:8080', 5000);
    expect(result.resetAt).toBe(15000);
  });
});

describe('resetRateLimit', () => {
  it('clears a specific key entry', () => {
    registerRule({ key: 'alert:22', maxEvents: 1, windowMs: 60000 });
    checkRateLimit('alert:22', 1000);
    resetRateLimit('alert:22');
    const result = checkRateLimit('alert:22', 2000);
    expect(result.allowed).toBe(true);
  });
});

describe('purgeExpiredRateLimits', () => {
  it('removes expired entries and returns count', () => {
    registerRule({ key: 'alert:3000', maxEvents: 5, windowMs: 1000 });
    checkRateLimit('alert:3000', 1000);
    const purged = purgeExpiredRateLimits(5000);
    expect(purged).toBe(1);
    expect(getRateLimitStore().entries['alert:3000']).toBeUndefined();
  });

  it('keeps active entries', () => {
    registerRule({ key: 'alert:9000', maxEvents: 5, windowMs: 60000 });
    checkRateLimit('alert:9000', 1000);
    const purged = purgeExpiredRateLimits(2000);
    expect(purged).toBe(0);
  });
});
