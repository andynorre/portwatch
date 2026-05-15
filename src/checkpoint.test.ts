import {
  createCheckpointStore,
  addCheckpoint,
  getCheckpoint,
  listCheckpoints,
  pruneCheckpoints,
  computeCheckpointId,
} from './checkpoint';
import { PortInfo } from './scanner';

const makePorts = (count: number): PortInfo[] =>
  Array.from({ length: count }, (_, i) => ({
    port: 3000 + i,
    protocol: 'tcp',
    process: `proc${i}`,
    pid: 100 + i,
    state: 'LISTEN',
  }));

describe('createCheckpointStore', () => {
  it('initializes with empty entries and default max', () => {
    const store = createCheckpointStore();
    expect(store.entries).toHaveLength(0);
    expect(store.maxEntries).toBe(20);
  });

  it('respects custom maxEntries', () => {
    const store = createCheckpointStore(5);
    expect(store.maxEntries).toBe(5);
  });
});

describe('addCheckpoint', () => {
  it('adds an entry with correct fields', () => {
    const store = createCheckpointStore();
    const ports = makePorts(3);
    const entry = addCheckpoint(store, ports, 'initial');
    expect(entry.portCount).toBe(3);
    expect(entry.label).toBe('initial');
    expect(entry.id).toHaveLength(12);
    expect(store.entries).toHaveLength(1);
  });

  it('evicts oldest entry when maxEntries exceeded', () => {
    const store = createCheckpointStore(3);
    const e1 = addCheckpoint(store, makePorts(1));
    addCheckpoint(store, makePorts(2));
    addCheckpoint(store, makePorts(3));
    addCheckpoint(store, makePorts(4));
    expect(store.entries).toHaveLength(3);
    expect(store.entries.find(e => e.id === e1.id)).toBeUndefined();
  });

  it('produces stable checksum for same port set', () => {
    const store = createCheckpointStore();
    const ports = makePorts(2);
    const a = addCheckpoint(store, ports);
    const b = addCheckpoint(store, [...ports].reverse());
    expect(a.checksum).toBe(b.checksum);
  });
});

describe('getCheckpoint', () => {
  it('retrieves entry by id', () => {
    const store = createCheckpointStore();
    const entry = addCheckpoint(store, makePorts(1));
    expect(getCheckpoint(store, entry.id)).toEqual(entry);
  });

  it('returns undefined for unknown id', () => {
    const store = createCheckpointStore();
    expect(getCheckpoint(store, 'nonexistent')).toBeUndefined();
  });
});

describe('listCheckpoints', () => {
  it('returns entries in reverse chronological order', () => {
    const store = createCheckpointStore();
    addCheckpoint(store, makePorts(1));
    addCheckpoint(store, makePorts(2));
    addCheckpoint(store, makePorts(3));
    const list = listCheckpoints(store);
    expect(list[0].portCount).toBe(3);
    expect(list[2].portCount).toBe(1);
  });
});

describe('pruneCheckpoints', () => {
  it('removes entries older than threshold', () => {
    const store = createCheckpointStore();
    const old = addCheckpoint(store, makePorts(1));
    old.timestamp = Date.now() - 10000;
    addCheckpoint(store, makePorts(2));
    const removed = pruneCheckpoints(store, 5000);
    expect(removed).toBe(1);
    expect(store.entries).toHaveLength(1);
  });

  it('returns 0 when nothing pruned', () => {
    const store = createCheckpointStore();
    addCheckpoint(store, makePorts(1));
    expect(pruneCheckpoints(store, 60000)).toBe(0);
  });
});

describe('computeCheckpointId', () => {
  it('returns 12-char hex string', () => {
    const id = computeCheckpointId(Date.now(), 'abc123');
    expect(id).toMatch(/^[0-9a-f]{12}$/);
  });
});
