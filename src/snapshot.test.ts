import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  snapshotsMatch,
} from './snapshot';
import { PortEntry } from './scanner';

const mockPorts: PortEntry[] = [
  { protocol: 'tcp', port: 3000, pid: 1234, process: 'node', state: 'LISTEN' },
  { protocol: 'tcp', port: 8080, pid: 5678, process: 'nginx', state: 'LISTEN' },
];

describe('createSnapshot', () => {
  it('should create a snapshot with timestamp and checksum', () => {
    const snap = createSnapshot(mockPorts);
    expect(snap.ports).toEqual(mockPorts);
    expect(snap.timestamp).toBeGreaterThan(0);
    expect(snap.checksum).toBeTruthy();
    expect(typeof snap.checksum).toBe('string');
  });

  it('should produce same checksum for identical port lists', () => {
    const a = createSnapshot(mockPorts);
    const b = createSnapshot([...mockPorts]);
    expect(a.checksum).toBe(b.checksum);
  });

  it('should produce different checksum when ports differ', () => {
    const a = createSnapshot(mockPorts);
    const b = createSnapshot([
      { protocol: 'tcp', port: 9999, pid: 999, process: 'other', state: 'LISTEN' },
    ]);
    expect(a.checksum).not.toBe(b.checksum);
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `portwatch-snap-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('should save and reload a snapshot', () => {
    const snap = createSnapshot(mockPorts);
    saveSnapshot(snap, tmpFile);
    const loaded = loadSnapshot(tmpFile);
    expect(loaded).not.toBeNull();
    expect(loaded!.checksum).toBe(snap.checksum);
    expect(loaded!.ports).toEqual(snap.ports);
  });

  it('should return null when file does not exist', () => {
    const result = loadSnapshot('/nonexistent/path/snap.json');
    expect(result).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    fs.writeFileSync(tmpFile, 'not-json', 'utf-8');
    const result = loadSnapshot(tmpFile);
    expect(result).toBeNull();
  });
});

describe('snapshotsMatch', () => {
  it('should return true for snapshots with same checksum', () => {
    const a = createSnapshot(mockPorts);
    const b = createSnapshot(mockPorts);
    expect(snapshotsMatch(a, b)).toBe(true);
  });

  it('should return false for snapshots with different checksums', () => {
    const a = createSnapshot(mockPorts);
    const b = createSnapshot([]);
    expect(snapshotsMatch(a, b)).toBe(false);
  });
});
