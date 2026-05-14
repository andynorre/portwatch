import { describe, it, expect, beforeEach } from "vitest";
import { mergeBaseline, pruneBaseline } from "./baseline.merge";
import type { BaselineStore, PortEntry } from "./baseline.types";

function makeStore(ports: PortEntry[]): BaselineStore {
  return {
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ports,
  };
}

function makePort(port: number, process = "proc"): PortEntry {
  return { port, protocol: "tcp", process, pid: 100 + port };
}

describe("mergeBaseline", () => {
  let base: BaselineStore;

  beforeEach(() => {
    base = makeStore([makePort(80), makePort(443)]);
  });

  it("union adds new ports and retains existing", () => {
    const result = mergeBaseline(base, [makePort(443), makePort(8080)], "union");
    const ports = result.ports.map((p) => p.port).sort((a, b) => a - b);
    expect(ports).toEqual([80, 443, 8080]);
  });

  it("replace discards baseline and uses incoming", () => {
    const result = mergeBaseline(base, [makePort(9000)], "replace");
    expect(result.ports).toHaveLength(1);
    expect(result.ports[0].port).toBe(9000);
  });

  it("intersect keeps only shared ports", () => {
    const result = mergeBaseline(base, [makePort(443), makePort(8080)], "intersect");
    expect(result.ports).toHaveLength(1);
    expect(result.ports[0].port).toBe(443);
  });

  it("defaults to union strategy", () => {
    const result = mergeBaseline(base, [makePort(22)]);
    expect(result.ports.map((p) => p.port)).toContain(22);
    expect(result.ports.map((p) => p.port)).toContain(80);
  });

  it("updates updatedAt timestamp", () => {
    const result = mergeBaseline(base, [], "union");
    expect(result.updatedAt).not.toBe(base.updatedAt);
  });
});

describe("pruneBaseline", () => {
  it("does nothing when under limit", () => {
    const store = makeStore([makePort(80), makePort(443)]);
    const result = pruneBaseline(store, 10);
    expect(result.ports).toHaveLength(2);
  });

  it("trims to maxEntries", () => {
    const store = makeStore([makePort(80), makePort(443), makePort(8080)]);
    const result = pruneBaseline(store, 2);
    expect(result.ports).toHaveLength(2);
  });

  it("does nothing when exactly at limit", () => {
    const store = makeStore([makePort(80), makePort(443)]);
    const result = pruneBaseline(store, 2);
    expect(result.ports).toHaveLength(2);
    expect(result.updatedAt).toBe(store.updatedAt);
  });
});
