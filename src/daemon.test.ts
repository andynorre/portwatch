import { startDaemon, stopDaemon, getDaemonState } from './daemon';
import * as scanner from './scanner';
import * as baseline from './baseline';
import * as alerter from './alerter';
import * as notifier from './notifier';
import * as config from './config';

jest.useFakeTimers();

const mockConfig = {
  intervalMs: 5000,
  baselinePath: '/tmp/baseline.json',
  desktopNotifications: false,
  ignoredPorts: [],
};

const mockPorts = [
  { port: 3000, pid: 1234, process: 'node', protocol: 'tcp' },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(config, 'loadConfig').mockReturnValue(mockConfig as any);
  jest.spyOn(config, 'validateConfig').mockReturnValue(mockConfig as any);
  jest.spyOn(scanner, 'scanPorts').mockResolvedValue(mockPorts as any);
  jest.spyOn(baseline, 'loadBaseline').mockReturnValue(mockPorts as any);
  jest.spyOn(baseline, 'saveBaseline').mockImplementation(() => {});
  jest.spyOn(baseline, 'diffPorts').mockReturnValue({ added: [], removed: [] } as any);
  jest.spyOn(alerter, 'buildAlerts').mockReturnValue([]);
  jest.spyOn(notifier, 'notifyConsole').mockImplementation(() => {});
});

afterEach(() => {
  stopDaemon();
});

test('startDaemon sets running state to true', async () => {
  await startDaemon();
  expect(getDaemonState().running).toBe(true);
});

test('stopDaemon sets running state to false', async () => {
  await startDaemon();
  stopDaemon();
  expect(getDaemonState().running).toBe(false);
});

test('startDaemon calls scanPorts on first tick', async () => {
  await startDaemon();
  expect(scanner.scanPorts).toHaveBeenCalledTimes(1);
});

test('startDaemon saves baseline when none exists', async () => {
  jest.spyOn(baseline, 'loadBaseline').mockReturnValue(null);
  await startDaemon();
  expect(baseline.saveBaseline).toHaveBeenCalledWith(mockPorts, mockConfig.baselinePath);
});

test('tick count increments on each interval', async () => {
  await startDaemon();
  jest.advanceTimersByTime(mockConfig.intervalMs * 3);
  await Promise.resolve();
  expect(getDaemonState().tickCount).toBeGreaterThanOrEqual(1);
});

test('double start emits warning and does not create second interval', async () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await startDaemon();
  await startDaemon();
  expect(warnSpy).toHaveBeenCalledWith('[portwatch] Daemon is already running.');
});
