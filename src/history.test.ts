import * as fs from 'fs';
import * as path from 'path';
import {
  createHistoryStore,
  addHistoryEntry,
  saveHistory,
  loadHistory,
  getRecentEntries,
  clearHistory,
} from './history';
import { HistoryEntry } from './history.types';

const TEST_PATH = path.join(__dirname, '__test_history__.json');

const makeEntry = (offset = 0): HistoryEntry => ({
  timestamp: 1700000000000 + offset,
  checksum: `abc${offset}`,
  alertCount: offset,
  ports: [`80${offset}`, `443${offset}`],
});

afterEach(() => {
  if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
});

describe('createHistoryStore', () => {
  it('creates an empty store with defaults', () => {
    const store = createHistoryStore(TEST_PATH, 50);
    expect(store.entries).toHaveLength(0);
    expect(store.maxEntries).toBe(50);
    expect(store.filePath).toBe(TEST_PATH);
  });
});

describe('addHistoryEntry', () => {
  it('prepends entries and respects maxEntries', () => {
    let store = createHistoryStore(TEST_PATH, 3);
    store = addHistoryEntry(store, makeEntry(1));
    store = addHistoryEntry(store, makeEntry(2));
    store = addHistoryEntry(store, makeEntry(3));
    store = addHistoryEntry(store, makeEntry(4));
    expect(store.entries).toHaveLength(3);
    expect(store.entries[0].checksum).toBe('abc4');
  });
});

describe('saveHistory / loadHistory', () => {
  it('persists and restores entries', () => {
    let store = createHistoryStore(TEST_PATH, 10);
    store = addHistoryEntry(store, makeEntry(1));
    store = addHistoryEntry(store, makeEntry(2));
    saveHistory(store);
    const loaded = loadHistory(TEST_PATH, 10);
    expect(loaded.entries).toHaveLength(2);
    expect(loaded.entries[0].checksum).toBe('abc2');
  });

  it('returns empty store when file does not exist', () => {
    const store = loadHistory('/nonexistent/path.json', 10);
    expect(store.entries).toHaveLength(0);
  });
});

describe('getRecentEntries', () => {
  it('returns up to count entries', () => {
    let store = createHistoryStore(TEST_PATH, 10);
    for (let i = 0; i < 5; i++) store = addHistoryEntry(store, makeEntry(i));
    const recent = getRecentEntries(store, 3);
    expect(recent).toHaveLength(3);
  });
});

describe('clearHistory', () => {
  it('empties the entries array', () => {
    let store = createHistoryStore(TEST_PATH, 10);
    store = addHistoryEntry(store, makeEntry(1));
    store = clearHistory(store);
    expect(store.entries).toHaveLength(0);
  });
});
