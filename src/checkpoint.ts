import * as fs from 'fs';
import * as crypto from 'crypto';
import { CheckpointEntry, CheckpointStore } from './checkpoint.types';
import { PortInfo } from './scanner';

const DEFAULT_MAX_ENTRIES = 20;

export function createCheckpointStore(maxEntries = DEFAULT_MAX_ENTRIES): CheckpointStore {
  return { entries: [], maxEntries };
}

export function computeCheckpointId(timestamp: number, checksum: string): string {
  return crypto
    .createHash('sha1')
    .update(`${timestamp}:${checksum}`)
    .digest('hex')
    .slice(0, 12);
}

export function addCheckpoint(
  store: CheckpointStore,
  ports: PortInfo[],
  label?: string
): CheckpointEntry {
  const timestamp = Date.now();
  const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(ports.map(p => `${p.port}:${p.protocol}:${p.process}`).sort()))
    .digest('hex');
  const id = computeCheckpointId(timestamp, checksum);
  const entry: CheckpointEntry = { id, timestamp, portCount: ports.length, checksum, label };
  store.entries.push(entry);
  if (store.entries.length > store.maxEntries) {
    store.entries.shift();
  }
  return entry;
}

export function getCheckpoint(store: CheckpointStore, id: string): CheckpointEntry | undefined {
  return store.entries.find(e => e.id === id);
}

export function listCheckpoints(store: CheckpointStore): CheckpointEntry[] {
  return [...store.entries].reverse();
}

export function saveCheckpointStore(store: CheckpointStore, filePath: string): void {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function loadCheckpointStore(filePath: string): CheckpointStore {
  if (!fs.existsSync(filePath)) {
    return createCheckpointStore();
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as CheckpointStore;
}

export function pruneCheckpoints(store: CheckpointStore, olderThanMs: number): number {
  const cutoff = Date.now() - olderThanMs;
  const before = store.entries.length;
  store.entries = store.entries.filter(e => e.timestamp >= cutoff);
  return before - store.entries.length;
}
