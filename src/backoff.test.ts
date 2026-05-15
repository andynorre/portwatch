import {
  createBackoffState,
  computeDelay,
  advanceBackoff,
  resetBackoff,
  hasExceededMaxAttempts,
} from "./backoff";

describe("createBackoffState", () => {
  it("returns zeroed initial state", () => {
    const state = createBackoffState();
    expect(state.attempt).toBe(0);
    expect(state.lastDelayMs).toBe(0);
    expect(state.totalWaitedMs).toBe(0);
  });
});

describe("computeDelay", () => {
  it("returns 0 on first attempt with no jitter", () => {
    const state = createBackoffState();
    const delay = computeDelay(state, { baseMs: 500, multiplier: 2, maxMs: 30000, jitter: false });
    expect(delay).toBe(500);
  });

  it("caps delay at maxMs", () => {
    const state = { attempt: 20, lastDelayMs: 0, totalWaitedMs: 0 };
    const delay = computeDelay(state, { baseMs: 500, multiplier: 2, maxMs: 1000, jitter: false });
    expect(delay).toBe(1000);
  });

  it("applies jitter within [0, raw]", () => {
    const state = createBackoffState();
    for (let i = 0; i < 20; i++) {
      const delay = computeDelay(state, { baseMs: 1000, multiplier: 2, maxMs: 30000, jitter: true });
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(1000);
    }
  });

  it("doubles delay on each attempt without jitter", () => {
    const s0 = createBackoffState();
    const s1 = { ...s0, attempt: 1 };
    const s2 = { ...s0, attempt: 2 };
    const opts = { baseMs: 100, multiplier: 2, maxMs: 10000, jitter: false };
    expect(computeDelay(s0, opts)).toBe(100);
    expect(computeDelay(s1, opts)).toBe(200);
    expect(computeDelay(s2, opts)).toBe(400);
  });
});

describe("advanceBackoff", () => {
  it("increments attempt and records delay", () => {
    const state = createBackoffState();
    const next = advanceBackoff(state, { baseMs: 200, multiplier: 2, maxMs: 5000, jitter: false });
    expect(next.attempt).toBe(1);
    expect(next.lastDelayMs).toBe(200);
    expect(next.totalWaitedMs).toBe(200);
  });

  it("accumulates totalWaitedMs across advances", () => {
    let state = createBackoffState();
    const opts = { baseMs: 100, multiplier: 2, maxMs: 10000, jitter: false };
    state = advanceBackoff(state, opts); // 100
    state = advanceBackoff(state, opts); // 200
    expect(state.totalWaitedMs).toBe(300);
    expect(state.attempt).toBe(2);
  });
});

describe("resetBackoff", () => {
  it("resets state to initial values", () => {
    const advanced = advanceBackoff(
      advanceBackoff(createBackoffState(), { jitter: false }),
      { jitter: false }
    );
    const reset = resetBackoff();
    expect(reset).toEqual(createBackoffState());
    expect(advanced.attempt).toBeGreaterThan(0);
  });
});

describe("hasExceededMaxAttempts", () => {
  it("returns false when under limit", () => {
    const state = { attempt: 2, lastDelayMs: 0, totalWaitedMs: 0 };
    expect(hasExceededMaxAttempts(state, 5)).toBe(false);
  });

  it("returns true when at or over limit", () => {
    const state = { attempt: 5, lastDelayMs: 0, totalWaitedMs: 0 };
    expect(hasExceededMaxAttempts(state, 5)).toBe(true);
    expect(hasExceededMaxAttempts({ ...state, attempt: 6 }, 5)).toBe(true);
  });
});
