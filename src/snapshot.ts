import * as fs from 'fs';
import * as path from 'path';
import { PortEntry } from './scanner';

export interface Snapshot {
  timestamp: number;
  ports: PortEntry[];
  checksum: string;
}

function computeChecksum(ports: PortEntry[]): string {
  const data = ports
    .map(p => `${p.protocol}:${p.port}:${p.pid}:${p.process}`)
    .sort()
    .join('|');
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function createSnapshot(ports: PortEntry[]): Snapshot {
  return {
    timestamp: Date.now(),
    ports,
    checksum: computeChecksum(ports),
  };
}

export function saveSnapshot(snapshot: Snapshot, filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function loadSnapshot(filePath: string): Snapshot | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export function snapshotsMatch(a: Snapshot, b: Snapshot): boolean {
  return a.checksum === b.checksum;
}
