import {
  createBufferStore,
  addToBuffer,
  shouldFlush,
  flushBuffer,
  summarizeBuffer,
  purgeBufferBefore,
} from './buffer';
import { BufferedAlert } from './buffer.types';

function makeAlert(overrides: Partial<BufferedAlert> = {}): BufferedAlert {
  return {
    id: 'a1',
    timestamp: 1000,
    port: 8080,
    protocol: 'tcp',
    process: 'node',
    message: 'unexpected binding',
    severity: 'high',
    ...overrides,
  };
}

describe('createBufferStore', () => {
  it('creates store with defaults', () => {
    const store = createBufferStore();
    expect(store.entries).toHaveLength(0);
    expect(store.maxSize).toBe(100);
    expect(store.flushIntervalMs).toBe(5000);
  });
});

describe('addToBuffer', () => {
  it('appends an alert', () => {
    const store = createBufferStore();
    const next = addToBuffer(store, makeAlert());
    expect(next.entries).toHaveLength(1);
  });

  it('trims to maxSize', () => {
    let store = createBufferStore(3);
    for (let i = 0; i < 5; i++) {
      store = addToBuffer(store, makeAlert({ id: `a${i}` }));
    }
    expect(store.entries).toHaveLength(3);
    expect(store.entries[0].id).toBe('a2');
  });
});

describe('shouldFlush', () => {
  it('returns false when empty', () => {
    const store = createBufferStore();
    expect(shouldFlush(store, 9999)).toBe(false);
  });

  it('returns true when full', () => {
    let store = createBufferStore(2);
    store = addToBuffer(store, makeAlert({ id: 'a1' }));
    store = addToBuffer(store, makeAlert({ id: 'a2' }));
    expect(shouldFlush(store)).toBe(true);
  });

  it('returns true when interval elapsed', () => {
    let store = createBufferStore(100, 1000);
    store = addToBuffer(store, makeAlert());
    expect(shouldFlush(store, store.lastFlushedAt + 2000)).toBe(true);
  });
});

describe('flushBuffer', () => {
  it('returns entries and resets store', () => {
    let store = createBufferStore();
    store = addToBuffer(store, makeAlert());
    const { flushed, store: next } = flushBuffer(store, 9999);
    expect(flushed).toHaveLength(1);
    expect(next.entries).toHaveLength(0);
    expect(next.lastFlushedAt).toBe(9999);
  });
});

describe('summarizeBuffer', () => {
  it('returns empty summary for empty store', () => {
    const store = createBufferStore();
    const s = summarizeBuffer(store);
    expect(s.count).toBe(0);
    expect(s.oldestAt).toBeNull();
  });

  it('counts severities', () => {
    let store = createBufferStore();
    store = addToBuffer(store, makeAlert({ severity: 'high', timestamp: 100 }));
    store = addToBuffer(store, makeAlert({ severity: 'low', timestamp: 200 }));
    const s = summarizeBuffer(store);
    expect(s.severityCounts['high']).toBe(1);
    expect(s.severityCounts['low']).toBe(1);
    expect(s.oldestAt).toBe(100);
    expect(s.newestAt).toBe(200);
  });
});

describe('purgeBufferBefore', () => {
  it('removes entries older than cutoff', () => {
    let store = createBufferStore();
    store = addToBuffer(store, makeAlert({ timestamp: 500 }));
    store = addToBuffer(store, makeAlert({ timestamp: 1500 }));
    const next = purgeBufferBefore(store, 1000);
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0].timestamp).toBe(1500);
  });
});
