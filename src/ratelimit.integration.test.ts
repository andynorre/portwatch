import {
  registerRule,
  checkRateLimit,
  resetRateLimit,
  purgeExpiredRateLimits,
} from './ratelimit';
import { buildAlerts } from './alerter';
import type { PortDiff } from './baseline';

beforeEach(() => {
  resetRateLimit();
});

describe('ratelimit + alerter integration', () => {
  const mockDiff: PortDiff = {
    added: [{ port: 4444, protocol: 'tcp', process: 'nc', pid: 999, address: '0.0.0.0' }],
    removed: [],
  };

  it('gates alert dispatch based on rate limit', () => {
    registerRule({ key: 'alert:4444:tcp', maxEvents: 2, windowMs: 60000 });

    const alerts = buildAlerts(mockDiff);
    expect(alerts.length).toBe(1);

    const key = `alert:${alerts[0].port}:${alerts[0].protocol}`;

    const first = checkRateLimit(key, 1000);
    expect(first.allowed).toBe(true);

    const second = checkRateLimit(key, 2000);
    expect(second.allowed).toBe(true);

    const third = checkRateLimit(key, 3000);
    expect(third.allowed).toBe(false);
  });

  it('allows alerts again after window expires', () => {
    registerRule({ key: 'alert:4444:tcp', maxEvents: 1, windowMs: 5000 });
    const key = 'alert:4444:tcp';

    checkRateLimit(key, 1000);
    expect(checkRateLimit(key, 2000).allowed).toBe(false);
    expect(checkRateLimit(key, 7000).allowed).toBe(true);
  });

  it('purges stale entries after burst window', () => {
    registerRule({ key: 'alert:4444:tcp', maxEvents: 3, windowMs: 2000 });
    const key = 'alert:4444:tcp';
    checkRateLimit(key, 1000);
    checkRateLimit(key, 1500);
    const purged = purgeExpiredRateLimits(5000);
    expect(purged).toBeGreaterThanOrEqual(1);
  });
});
