import * as fs from 'fs';
import * as path from 'path';
import { HistoryEntry, HistoryStore } from './history.types';

const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_HISTORY_PATH = path.join(process.cwd(), '.portwatch_history.json');

export function createHistoryStore(
  filePath: string = DEFAULT_HISTORY_PATH,
  maxEntries: number = DEFAULT_MAX_ENTRIES
): HistoryStore {
  return { entries: [], maxEntries, filePath };
}

export function addHistoryEntry(
  store: HistoryStore,
  entry: HistoryEntry
): HistoryStore {
  const entries = [entry, ...store.entries].slice(0, store.maxEntries);
  return { ...store, entries };
}

export function saveHistory(store: HistoryStore): void {
  const dir = path.dirname(store.filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(store.filePath, JSON.stringify(store.entries, null, 2), 'utf-8');
}

export function loadHistory(
  filePath: string = DEFAULT_HISTORY_PATH,
  maxEntries: number = DEFAULT_MAX_ENTRIES
): HistoryStore {
  if (!fs.existsSync(filePath)) {
    return createHistoryStore(filePath, maxEntries);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const entries: HistoryEntry[] = JSON.parse(raw);
    return { entries, maxEntries, filePath };
  } catch {
    return createHistoryStore(filePath, maxEntries);
  }
}

export function getRecentEntries(
  store: HistoryStore,
  count: number
): HistoryEntry[] {
  return store.entries.slice(0, Math.min(count, store.entries.length));
}

export function clearHistory(store: HistoryStore): HistoryStore {
  return { ...store, entries: [] };
}
