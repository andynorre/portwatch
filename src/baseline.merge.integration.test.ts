import { describe, it, expect } from "vitest";
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

function makePort(port: number, process = "svc", protocol: "tcp" | "udp" = "tcp"): PortEntry {
  return { port, protocol, process, pid: 1000 + port };
}

describe("baseline.merge integration", () => {
  it("successive union merges accumulate unique entries", () => {
    let store = makeStore([makePort(80)]);
    store = mergeBaseline(store, [makePort(443)], "union");
    store = mergeBaseline(store, [makePort(8080)], "union");
    store = mergeBaseline(store, [makePort(443)], "union"); // duplicate
    expect(store.ports).toHaveLength(3);
  });

  it("merge then prune respects cap", () => {
    let store = makeStore([makePort(80), makePort(443)]);
    store = mergeBaseline(store, [makePort(8080), makePort(9090)], "union");
    store = pruneBaseline(store, 3);
    expect(store.ports).toHaveLength(3);
  });

  it("replace followed by intersect with empty incoming clears all", () => {
    let store = makeStore([makePort(80), makePort(443)]);
    store = mergeBaseline(store, [makePort(22)], "replace");
    store = mergeBaseline(store, [], "intersect");
    expect(store.ports).toHaveLength(0);
  });

  it("protocol distinction preserved in union", () => {
    const store = makeStore([makePort(53, "dns", "tcp")]);
    const result = mergeBaseline(store, [makePort(53, "dns", "udp")], "union");
    expect(result.ports).toHaveLength(2);
  });
});
