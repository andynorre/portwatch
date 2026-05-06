import { startWatcher, stopWatcher, getWatcherState } from './watcher';
import * as scanner from './scanner';
import * as baseline from './baseline';
import * as alerter from './alerter';
import * as notifier from './notifier';
import * as config from './config';

jest.mock('./scanner');
jest.mock('./baseline');
jest.mock('./alerter');
jest.mock('./notifier');
jest.mock('./config');

const mockScanPorts = scanner.scanPorts as jest.Mock;
const mockLoadBaseline = baseline.loadBaseline as jest.Mock;
const mockSaveBaseline = baseline.saveBaseline as jest.Mock;
const mockDiffPorts = baseline.diffPorts as jest.Mock;
const mockBuildAlerts = alerter.buildAlerts as jest.Mock;
const mockNotifyConsole = notifier.notifyConsole as jest.Mock;
const mockLoadConfig = config.loadConfig as jest.Mock;

const fakePorts = [{ port: 8080, pid: 1234, process: 'node', protocol: 'tcp' as const }];
const fakeConfig = { intervalSeconds: 1, baselinePath: '/tmp/baseline.json', desktopNotifications: false };

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockLoadConfig.mockResolvedValue(fakeConfig);
  mockScanPorts.mockResolvedValue(fakePorts);
  mockLoadBaseline.mockResolvedValue(null);
  mockSaveBaseline.mockResolvedValue(undefined);
  mockDiffPorts.mockReturnValue({ added: [], removed: [] });
  mockBuildAlerts.mockReturnValue([]);
});

afterEach(() => {
  stopWatcher();
  jest.useRealTimers();
});

test('startWatcher creates baseline on first run', async () => {
  await startWatcher();
  expect(mockSaveBaseline).toHaveBeenCalledWith(fakePorts, fakeConfig.baselinePath);
  expect(mockNotifyConsole).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
});

test('startWatcher throws if already running', async () => {
  await startWatcher();
  await expect(startWatcher()).rejects.toThrow('Watcher is already running');
});

test('getWatcherState reflects running status', async () => {
  expect(getWatcherState().running).toBe(false);
  await startWatcher();
  expect(getWatcherState().running).toBe(true);
  stopWatcher();
  expect(getWatcherState().running).toBe(false);
});

test('stopWatcher stops interval and updates state', async () => {
  await startWatcher();
  const stateBefore = getWatcherState();
  expect(stateBefore.running).toBe(true);
  stopWatcher();
  const stateAfter = getWatcherState();
  expect(stateAfter.running).toBe(false);
  expect(stateAfter.tickCount).toBe(stateBefore.tickCount);
});

test('watcher notifies on new alerts', async () => {
  const fakeAlert = { type: 'warn' as const, message: 'New port 9090', ports: fakePorts };
  mockLoadBaseline.mockResolvedValue(fakePorts);
  mockDiffPorts.mockReturnValue({ added: fakePorts, removed: [] });
  mockBuildAlerts.mockReturnValue([fakeAlert]);

  await startWatcher();
  expect(mockNotifyConsole).toHaveBeenCalledWith(fakeAlert);
});
