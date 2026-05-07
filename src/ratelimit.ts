import type {
  RateLimitRule,
  RateLimitStore,
  RateLimitResult,
} from './ratelimit.types';

let store: RateLimitStore = { entries: {}, rules: {} };

export function createRateLimitStore(): RateLimitStore {
  return { entries: {}, rules: {} };
}

export function registerRule(rule: RateLimitRule): void {
  store.rules[rule.key] = rule;
}

export function checkRateLimit(
  key: string,
  now: number = Date.now()
): RateLimitResult {
  const rule = store.rules[key];
  if (!rule) {
    return { allowed: true, remaining: Infinity, resetAt: 0 };
  }

  const entry = store.entries[key];
  const windowStart = entry ? entry.windowStart : now;
  const elapsed = now - windowStart;

  if (!entry || elapsed >= rule.windowMs) {
    store.entries[key] = { count: 1, windowStart: now };
    return {
      allowed: true,
      remaining: rule.maxEvents - 1,
      resetAt: now + rule.windowMs,
    };
  }

  if (entry.count >= rule.maxEvents) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStart + rule.windowMs,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: rule.maxEvents - entry.count,
    resetAt: windowStart + rule.windowMs,
  };
}

export function resetRateLimit(key?: string): void {
  if (key) {
    delete store.entries[key];
  } else {
    store = { entries: {}, rules: { ...store.rules } };
  }
}

export function getRateLimitStore(): RateLimitStore {
  return store;
}

export function purgeExpiredRateLimits(now: number = Date.now()): number {
  let purged = 0;
  for (const key of Object.keys(store.entries)) {
    const rule = store.rules[key];
    const entry = store.entries[key];
    if (!rule || now - entry.windowStart >= rule.windowMs) {
      delete store.entries[key];
      purged++;
    }
  }
  return purged;
}
