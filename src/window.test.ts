import {
  createWindowStore,
  windowKey,
  recordWindowEvent,
  purgeWindowEntries,
  getWindowSummary,
  getAllWindowSummaries,
} from './window';

const WINDOW_MS = 5000;

describe('createWindowStore', () => {
  it('initialises with correct windowMs and empty entries', () => {
    const store = createWindowStore(WINDOW_MS);
    expect(store.windowMs).toBe(WINDOW_MS);
    expect(store.entries.size).toBe(0);
  });
});

describe('windowKey', () => {
  it('formats key as protocol:port', () => {
    expect(windowKey(8080, 'tcp')).toBe('tcp:8080');
    expect(windowKey(53, 'udp')).toBe('udp:53');
  });
});

describe('recordWindowEvent', () => {
  it('creates a new entry on first event', () => {
    const store = createWindowStore(WINDOW_MS);
    const entry = recordWindowEvent(store, 'tcp:80', 1000);
    expect(entry.count).toBe(1);
    expect(entry.firstSeen).toBe(1000);
    expect(entry.lastSeen).toBe(1000);
    expect(store.entries.size).toBe(1);
  });

  it('increments count on subsequent events', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    const entry = recordWindowEvent(store, 'tcp:80', 2000);
    expect(entry.count).toBe(2);
    expect(entry.lastSeen).toBe(2000);
    expect(entry.firstSeen).toBe(1000);
  });

  it('tracks separate keys independently', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    recordWindowEvent(store, 'udp:53', 1000);
    expect(store.entries.size).toBe(2);
  });
});

describe('purgeWindowEntries', () => {
  it('removes entries outside the window', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    const pruned = purgeWindowEntries(store, 1000 + WINDOW_MS + 1);
    expect(pruned).toBe(1);
    expect(store.entries.size).toBe(0);
  });

  it('retains entries within the window', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    const pruned = purgeWindowEntries(store, 1000 + WINDOW_MS - 1);
    expect(pruned).toBe(0);
    expect(store.entries.size).toBe(1);
  });
});

describe('getWindowSummary', () => {
  it('returns null for unknown key', () => {
    const store = createWindowStore(WINDOW_MS);
    expect(getWindowSummary(store, 'tcp:9999', 1000)).toBeNull();
  });

  it('returns null for expired entry', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    expect(getWindowSummary(store, 'tcp:80', 1000 + WINDOW_MS + 1)).toBeNull();
  });

  it('returns summary with correct rate', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    recordWindowEvent(store, 'tcp:80', 3000);
    const summary = getWindowSummary(store, 'tcp:80', 3000);
    expect(summary).not.toBeNull();
    expect(summary!.count).toBe(2);
    expect(summary!.rate).toBeCloseTo(1, 0);
  });
});

describe('getAllWindowSummaries', () => {
  it('returns all active summaries', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    recordWindowEvent(store, 'udp:53', 1000);
    const summaries = getAllWindowSummaries(store, 2000);
    expect(summaries).toHaveLength(2);
  });

  it('excludes expired entries', () => {
    const store = createWindowStore(WINDOW_MS);
    recordWindowEvent(store, 'tcp:80', 1000);
    const summaries = getAllWindowSummaries(store, 1000 + WINDOW_MS + 1);
    expect(summaries).toHaveLength(0);
  });
});
