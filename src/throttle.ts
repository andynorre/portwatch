/**
 * throttle.ts
 * Provides alert throttling to prevent notification floods
 * when a port state oscillates or scanner runs frequently.
 */

export interface ThrottleEntry {
  lastAlertedAt: number;
  count: number;
}

export interface ThrottleStore {
  [key: string]: ThrottleEntry;
}

export interface ThrottleConfig {
  /** Minimum milliseconds between repeated alerts for the same key */
  windowMs: number;
  /** Maximum alerts allowed within the window before suppressing */
  maxCount: number;
}

const DEFAULT_CONFIG: ThrottleConfig = {
  windowMs: 60_000,
  maxCount: 3,
};

let store: ThrottleStore = {};

/**
 * Returns true if the alert for the given key should be suppressed.
 * A key is typically "<protocol>:<port>" or "<process>:<port>".
 */
export function shouldThrottle(
  key: string,
  config: ThrottleConfig = DEFAULT_CONFIG,
  now: number = Date.now()
): boolean {
  const entry = store[key];

  if (!entry) {
    store[key] = { lastAlertedAt: now, count: 1 };
    return false;
  }

  const elapsed = now - entry.lastAlertedAt;

  if (elapsed > config.windowMs) {
    // Window has expired — reset
    store[key] = { lastAlertedAt: now, count: 1 };
    return false;
  }

  if (entry.count < config.maxCount) {
    store[key] = { lastAlertedAt: entry.lastAlertedAt, count: entry.count + 1 };
    return false;
  }

  // Within window and over limit — suppress
  return true;
}

/** Returns a snapshot of the current throttle store (for testing / inspection). */
export function getThrottleStore(): ThrottleStore {
  return { ...store };
}

/** Resets the throttle store — useful between daemon cycles or in tests. */
export function resetThrottleStore(): void {
  store = {};
}

/**
 * Removes all entries from the throttle store whose windows have already
 * expired. Call this periodically (e.g. at the start of each scan cycle)
 * to prevent the store from growing unbounded over long daemon uptime.
 */
export function pruneThrottleStore(
  config: ThrottleConfig = DEFAULT_CONFIG,
  now: number = Date.now()
): number {
  let pruned = 0;
  for (const key of Object.keys(store)) {
    if (now - store[key].lastAlertedAt > config.windowMs) {
      delete store[key];
      pruned++;
    }
  }
  return pruned;
}
