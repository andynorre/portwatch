import {
  shouldThrottle,
  resetThrottleStore,
  getThrottleStore,
  ThrottleConfig,
} from "./throttle";

const config: ThrottleConfig = { windowMs: 10_000, maxCount: 2 };

beforeEach(() => {
  resetThrottleStore();
});

describe("shouldThrottle", () => {
  it("allows the first alert for a new key", () => {
    expect(shouldThrottle("tcp:8080", config, 1000)).toBe(false);
  });

  it("allows alerts up to maxCount within the window", () => {
    expect(shouldThrottle("tcp:8080", config, 1000)).toBe(false);
    expect(shouldThrottle("tcp:8080", config, 2000)).toBe(false);
  });

  it("suppresses alerts beyond maxCount within the window", () => {
    shouldThrottle("tcp:8080", config, 1000);
    shouldThrottle("tcp:8080", config, 2000);
    expect(shouldThrottle("tcp:8080", config, 3000)).toBe(true);
  });

  it("resets after the window expires", () => {
    shouldThrottle("tcp:8080", config, 1000);
    shouldThrottle("tcp:8080", config, 2000);
    shouldThrottle("tcp:8080", config, 3000); // suppressed
    // Advance past windowMs
    expect(shouldThrottle("tcp:8080", config, 12_000)).toBe(false);
  });

  it("tracks different keys independently", () => {
    shouldThrottle("tcp:8080", config, 1000);
    shouldThrottle("tcp:8080", config, 2000);
    // 8080 is now throttled
    expect(shouldThrottle("tcp:8080", config, 3000)).toBe(true);
    // 9090 is a fresh key
    expect(shouldThrottle("tcp:9090", config, 3000)).toBe(false);
  });

  it("uses default config when none is provided", () => {
    expect(shouldThrottle("udp:53")).toBe(false);
  });
});

describe("getThrottleStore", () => {
  it("reflects entries after calls to shouldThrottle", () => {
    shouldThrottle("tcp:443", config, 5000);
    const s = getThrottleStore();
    expect(s["tcp:443"]).toBeDefined();
    expect(s["tcp:443"].count).toBe(1);
    expect(s["tcp:443"].lastAlertedAt).toBe(5000);
  });
});

describe("resetThrottleStore", () => {
  it("clears all entries", () => {
    shouldThrottle("tcp:80", config, 1000);
    resetThrottleStore();
    expect(getThrottleStore()).toEqual({});
  });
});
