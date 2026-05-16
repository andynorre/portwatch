import { WatchdogState } from './watchdog.types';

export interface HeartbeatRecord {
  timestamp: number;
  intervalMs: number;
  missedCount: number;
  healthy: boolean;
}

export interface HeartbeatStore {
  records: HeartbeatRecord[];
  lastSeen: number | null;
  expectedIntervalMs: number;
  maxMissed: number;
}

export function createHeartbeatStore(
  expectedIntervalMs: number,
  maxMissed = 3
): HeartbeatStore {
  return {
    records: [],
    lastSeen: null,
    expectedIntervalMs,
    maxMissed,
  };
}

export function recordHeartbeat(
  store: HeartbeatStore,
  now = Date.now()
): HeartbeatRecord {
  const intervalMs =
    store.lastSeen !== null ? now - store.lastSeen : store.expectedIntervalMs;
  const drift = Math.abs(intervalMs - store.expectedIntervalMs);
  const healthy = drift <= store.expectedIntervalMs * 0.5;

  const record: HeartbeatRecord = {
    timestamp: now,
    intervalMs,
    missedCount: 0,
    healthy,
  };

  store.lastSeen = now;
  store.records.push(record);
  return record;
}

export function getMissedHeartbeats(
  store: HeartbeatStore,
  now = Date.now()
): number {
  if (store.lastSeen === null) return 0;
  const elapsed = now - store.lastSeen;
  return Math.max(
    0,
    Math.floor(elapsed / store.expectedIntervalMs) - 1
  );
}

export function isHeartbeatHealthy(
  store: HeartbeatStore,
  now = Date.now()
): boolean {
  const missed = getMissedHeartbeats(store, now);
  return missed < store.maxMissed;
}

export function pruneHeartbeatRecords(
  store: HeartbeatStore,
  maxAge: number,
  now = Date.now()
): void {
  const cutoff = now - maxAge;
  store.records = store.records.filter((r) => r.timestamp >= cutoff);
}

export function getLatestHeartbeat(
  store: HeartbeatStore
): HeartbeatRecord | null {
  if (store.records.length === 0) return null;
  return store.records[store.records.length - 1];
}
