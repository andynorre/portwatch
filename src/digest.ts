import * as crypto from "crypto";
import { PortEntry } from "./scanner";

export interface DigestRecord {
  timestamp: number;
  hash: string;
  portCount: number;
}

export interface DigestStore {
  records: DigestRecord[];
  maxRecords: number;
}

export function createDigestStore(maxRecords = 100): DigestStore {
  return { records: [], maxRecords };
}

export function computePortsDigest(ports: PortEntry[]): string {
  const normalized = ports
    .map((p) => `${p.protocol}:${p.port}:${p.process ?? ""}:${p.pid ?? ""}`)
    .sort()
    .join("\n");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function recordDigest(
  store: DigestStore,
  ports: PortEntry[]
): DigestRecord {
  const record: DigestRecord = {
    timestamp: Date.now(),
    hash: computePortsDigest(ports),
    portCount: ports.length,
  };
  store.records.push(record);
  if (store.records.length > store.maxRecords) {
    store.records.shift();
  }
  return record;
}

export function hasDigestChanged(
  store: DigestStore,
  ports: PortEntry[]
): boolean {
  if (store.records.length === 0) return true;
  const latest = store.records[store.records.length - 1];
  const current = computePortsDigest(ports);
  return latest.hash !== current;
}

export function getLatestDigest(
  store: DigestStore
): DigestRecord | undefined {
  if (store.records.length === 0) return undefined;
  return store.records[store.records.length - 1];
}

export function purgeOldDigests(
  store: DigestStore,
  olderThanMs: number
): number {
  const cutoff = Date.now() - olderThanMs;
  const before = store.records.length;
  store.records = store.records.filter((r) => r.timestamp >= cutoff);
  return before - store.records.length;
}
