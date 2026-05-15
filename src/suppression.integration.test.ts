import * as fs from 'fs';
import * as path from 'path';
import {
  createSuppressionStore,
  addRule,
  isSuppressed,
  saveSuppressionStore,
  loadSuppressionStore,
  purgeExpired,
} from './suppression';
import { PortEntry } from './scanner';

const TMP_FILE = path.join('/tmp', `suppression_integration_${Date.now()}.json`);

afterAll(() => {
  if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
});

describe('suppression integration', () => {
  it('persists and reloads rules correctly', () => {
    let store = createSuppressionStore();
    store = addRule(store, { port: 5432, protocol: 'tcp', reason: 'postgres dev' });
    store = addRule(store, { portRange: [3000, 3999], reason: 'dev range' });
    saveSuppressionStore(store, TMP_FILE);

    const loaded = loadSuppressionStore(TMP_FILE);
    expect(loaded.rules).toHaveLength(2);
  });

  it('correctly suppresses matching entries after reload', () => {
    const loaded = loadSuppressionStore(TMP_FILE);
    const pgEntry: PortEntry = { port: 5432, protocol: 'tcp', process: 'postgres', pid: 42, state: 'LISTEN' };
    const devEntry: PortEntry = { port: 3001, protocol: 'tcp', process: 'webpack', pid: 99, state: 'LISTEN' };
    const otherEntry: PortEntry = { port: 8888, protocol: 'tcp', process: 'unknown', pid: 77, state: 'LISTEN' };

    expect(isSuppressed(loaded, pgEntry)).toBe(true);
    expect(isSuppressed(loaded, devEntry)).toBe(true);
    expect(isSuppressed(loaded, otherEntry)).toBe(false);
  });

  it('expired rules are purged and not applied', () => {
    let store = loadSuppressionStore(TMP_FILE);
    store = addRule(store, { port: 9999, reason: 'temp', expiresAt: Date.now() - 5000 });
    const purged = purgeExpired(store);
    const tmpEntry: PortEntry = { port: 9999, protocol: 'tcp', process: 'tmp', pid: 1, state: 'LISTEN' };
    expect(isSuppressed(purged, tmpEntry)).toBe(false);
  });

  it('non-expired rules are retained after purge', () => {
    let store = loadSuppressionStore(TMP_FILE);
    store = addRule(store, { port: 7777, reason: 'future', expiresAt: Date.now() + 60_000 });
    const purged = purgeExpired(store);
    const futureEntry: PortEntry = { port: 7777, protocol: 'tcp', process: 'future', pid: 2, state: 'LISTEN' };
    expect(isSuppressed(purged, futureEntry)).toBe(true);
  });
});
