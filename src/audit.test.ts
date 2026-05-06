import * as fs from 'fs';
import * as path from 'path';
import {
  createAuditLog,
  addAuditEntry,
  saveAuditLog,
  loadAuditLog,
  getEntriesBySeverity,
  pruneAuditLog,
} from './audit';
import { AuditLog } from './audit.types';

const TEST_PATH = path.join(__dirname, '__test_audit__.json');

afterEach(() => {
  if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
});

describe('createAuditLog', () => {
  it('creates an empty audit log with timestamps', () => {
    const log = createAuditLog();
    expect(log.entries).toHaveLength(0);
    expect(log.createdAt).toBeLessThanOrEqual(Date.now());
    expect(log.updatedAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('addAuditEntry', () => {
  it('appends an entry to the log', () => {
    let log = createAuditLog();
    log = addAuditEntry(log, 'port_opened', 'warning', { port: 8080, protocol: 'tcp' });
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].event).toBe('port_opened');
    expect(log.entries[0].severity).toBe('warning');
    expect(log.entries[0].port).toBe(8080);
  });

  it('does not mutate the original log', () => {
    const log = createAuditLog();
    const updated = addAuditEntry(log, 'test', 'info');
    expect(log.entries).toHaveLength(0);
    expect(updated.entries).toHaveLength(1);
  });
});

describe('saveAuditLog / loadAuditLog', () => {
  it('persists and restores a log', () => {
    let log = createAuditLog();
    log = addAuditEntry(log, 'daemon_started', 'info');
    saveAuditLog(log, TEST_PATH);
    const loaded = loadAuditLog(TEST_PATH);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].event).toBe('daemon_started');
  });

  it('returns empty log when file does not exist', () => {
    const log = loadAuditLog(TEST_PATH);
    expect(log.entries).toHaveLength(0);
  });
});

describe('getEntriesBySeverity', () => {
  it('filters entries by severity', () => {
    let log = createAuditLog();
    log = addAuditEntry(log, 'ev1', 'info');
    log = addAuditEntry(log, 'ev2', 'critical');
    log = addAuditEntry(log, 'ev3', 'info');
    expect(getEntriesBySeverity(log, 'info')).toHaveLength(2);
    expect(getEntriesBySeverity(log, 'critical')).toHaveLength(1);
    expect(getEntriesBySeverity(log, 'warning')).toHaveLength(0);
  });
});

describe('pruneAuditLog', () => {
  it('trims entries to maxEntries keeping the most recent', () => {
    let log = createAuditLog();
    for (let i = 0; i < 10; i++) {
      log = addAuditEntry(log, `event_${i}`, 'info');
    }
    const pruned = pruneAuditLog(log, 5);
    expect(pruned.entries).toHaveLength(5);
    expect(pruned.entries[0].event).toBe('event_5');
  });

  it('does not prune if under limit', () => {
    let log = createAuditLog();
    log = addAuditEntry(log, 'only', 'info');
    const pruned = pruneAuditLog(log, 10);
    expect(pruned.entries).toHaveLength(1);
  });
});
