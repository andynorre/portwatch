import { PortEntry } from './scanner';
import { createHash } from 'crypto';

export interface PortFingerprint {
  port: number;
  protocol: string;
  process: string;
  user: string;
  fingerprint: string;
  seenAt: number;
}

export interface FingerprintStore {
  entries: Map<string, PortFingerprint>;
}

export function createFingerprintStore(): FingerprintStore {
  return { entries: new Map() };
}

export function computeFingerprint(entry: PortEntry): string {
  const raw = `${entry.port}:${entry.protocol}:${entry.process ?? ''}:${entry.user ?? ''}`;
  return createHash('sha1').update(raw).digest('hex').slice(0, 16);
}

export function buildFingerprint(entry: PortEntry): PortFingerprint {
  return {
    port: entry.port,
    protocol: entry.protocol,
    process: entry.process ?? '',
    user: entry.user ?? '',
    fingerprint: computeFingerprint(entry),
    seenAt: Date.now(),
  };
}

export function upsertFingerprint(
  store: FingerprintStore,
  entry: PortEntry
): { fingerprint: PortFingerprint; changed: boolean } {
  const key = `${entry.port}/${entry.protocol}`;
  const next = buildFingerprint(entry);
  const existing = store.entries.get(key);
  const changed = !existing || existing.fingerprint !== next.fingerprint;
  if (changed) {
    store.entries.set(key, next);
  }
  return { fingerprint: next, changed };
}

export function getFingerprint(
  store: FingerprintStore,
  port: number,
  protocol: string
): PortFingerprint | undefined {
  return store.entries.get(`${port}/${protocol}`);
}

export function removeFingerprint(
  store: FingerprintStore,
  port: number,
  protocol: string
): boolean {
  return store.entries.delete(`${port}/${protocol}`);
}

export function listFingerprints(store: FingerprintStore): PortFingerprint[] {
  return Array.from(store.entries.values());
}
