/**
 * Integration-level smoke tests for the watcher lifecycle.
 * These tests use real timers and verify state transitions
 * without mocking internals deeply.
 */
import { startWatcher, stopWatcher, getWatcherState } from './watcher';
import * as scanner from './scanner';
import * as baseline from './baseline';
import * as config from './config';
import * as notifier from './notifier';

jest.mock('./scanner');
jest.mock('./baseline');
jest.mock('./config');
jest.mock('./notifier');

const mockScan = scanner.scanPorts as jest.Mock;
const mockLoad = baseline.loadBaseline as jest.Mock;
const mockSave = baseline.saveBaseline as jest.Mock;
const mockDiff = baseline.diffPorts as jest.Mock;
const mockConfig = config.loadConfig as jest.Mock;

const samplePorts = [
  { port: 3000, pid: 100, process: 'node', protocol: 'tcp' as const },
  { port: 5432, pid: 200, process: 'postgres', protocol: 'tcp' as const },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockConfig.mockResolvedValue({ intervalSeconds: 60, baselinePath: '/tmp/bl.json', desktopNotifications: false });
  mockScan.mockResolvedValue(samplePorts);
  mockLoad.mockResolvedValue(samplePorts);
  mockSave.mockResolvedValue(undefined);
  mockDiff.mockReturnValue({ added: [], removed: [] });
  (notifier.notifyConsole as jest.Mock).mockImplementation(() => {});
});

afterEach(() => {
  stopWatcher();
});

test('watcher state transitions: idle -> running -> stopped', async () => {
  expect(getWatcherState().running).toBe(false);

  await startWatcher({ intervalSeconds: 60 });
  const running = getWatcherState();
  expect(running.running).toBe(true);
  expect(running.tickCount).toBeGreaterThanOrEqual(1);
  expect(running.lastScan).toBeInstanceOf(Date);

  stopWatcher();
  expect(getWatcherState().running).toBe(false);
});

test('watcher increments tickCount on each scan', async () => {
  jest.useFakeTimers();
  mockConfig.mockResolvedValue({ intervalSeconds: 1, baselinePath: '/tmp/bl.json', desktopNotifications: false });

  await startWatcher({ intervalSeconds: 1 });
  expect(getWatcherState().tickCount).toBe(1);

  await jest.runOnlyPendingTimersAsync();
  expect(getWatcherState().tickCount).toBe(2);

  stopWatcher();
  jest.useRealTimers();
});
