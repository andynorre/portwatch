import {
  createDigestStore,
  computePortsDigest,
  recordDigest,
  hasDigestChanged,
  getLatestDigest,
  purgeOldDigests,
} from "./digest";
import { PortEntry } from "./scanner";

const makePorts = (overrides: Partial<PortEntry>[] = []): PortEntry[] =>
  overrides.map((o) => ({
    port: 8080,
    protocol: "tcp",
    process: "node",
    pid: 1234,
    state: "LISTEN",
    ...o,
  }));

describe("computePortsDigest", () => {
  it("returns a 64-char hex string", () => {
    const digest = computePortsDigest(makePorts([{ port: 80 }]));
    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic for same input", () => {
    const ports = makePorts([{ port: 80 }, { port: 443 }]);
    expect(computePortsDigest(ports)).toBe(computePortsDigest(ports));
  });

  it("differs for different port sets", () => {
    const a = computePortsDigest(makePorts([{ port: 80 }]));
    const b = computePortsDigest(makePorts([{ port: 443 }]));
    expect(a).not.toBe(b);
  });

  it("is order-independent", () => {
    const a = computePortsDigest(makePorts([{ port: 80 }, { port: 443 }]));
    const b = computePortsDigest(makePorts([{ port: 443 }, { port: 80 }]));
    expect(a).toBe(b);
  });
});

describe("recordDigest", () => {
  it("adds a record to the store", () => {
    const store = createDigestStore();
    const ports = makePorts([{ port: 3000 }]);
    const record = recordDigest(store, ports);
    expect(store.records).toHaveLength(1);
    expect(record.portCount).toBe(1);
    expect(record.hash).toHaveLength(64);
  });

  it("evicts oldest record when maxRecords exceeded", () => {
    const store = createDigestStore(2);
    recordDigest(store, makePorts([{ port: 1 }]));
    recordDigest(store, makePorts([{ port: 2 }]));
    recordDigest(store, makePorts([{ port: 3 }]));
    expect(store.records).toHaveLength(2);
    expect(store.records[0].portCount).toBe(1);
  });
});

describe("hasDigestChanged", () => {
  it("returns true when store is empty", () => {
    const store = createDigestStore();
    expect(hasDigestChanged(store, makePorts([{ port: 80 }]))).toBe(true);
  });

  it("returns false when digest matches latest", () => {
    const store = createDigestStore();
    const ports = makePorts([{ port: 80 }]);
    recordDigest(store, ports);
    expect(hasDigestChanged(store, ports)).toBe(false);
  });

  it("returns true when ports change", () => {
    const store = createDigestStore();
    recordDigest(store, makePorts([{ port: 80 }]));
    expect(hasDigestChanged(store, makePorts([{ port: 443 }]))).toBe(true);
  });
});

describe("getLatestDigest", () => {
  it("returns undefined for empty store", () => {
    expect(getLatestDigest(createDigestStore())).toBeUndefined();
  });

  it("returns the most recently added record", () => {
    const store = createDigestStore();
    recordDigest(store, makePorts([{ port: 1 }]));
    const last = recordDigest(store, makePorts([{ port: 2 }]));
    expect(getLatestDigest(store)).toBe(last);
  });
});

describe("purgeOldDigests", () => {
  it("removes records older than the cutoff", () => {
    const store = createDigestStore();
    store.records.push({ timestamp: Date.now() - 10000, hash: "abc", portCount: 1 });
    store.records.push({ timestamp: Date.now(), hash: "def", portCount: 2 });
    const removed = purgeOldDigests(store, 5000);
    expect(removed).toBe(1);
    expect(store.records).toHaveLength(1);
  });
});
