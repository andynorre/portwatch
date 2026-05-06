import * as daemon from './daemon';

const mockState = { running: true, intervalHandle: null, tickCount: 7 };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(daemon, 'startDaemon').mockResolvedValue(undefined);
  jest.spyOn(daemon, 'stopDaemon').mockImplementation(() => {});
  jest.spyOn(daemon, 'getDaemonState').mockReturnValue(mockState);
});

function runCli(args: string[]) {
  process.argv = ['node', 'cli.ts', ...args];
  jest.resetModules();
  return import('./cli');
}

test('start command calls startDaemon', async () => {
  await runCli(['start']);
  expect(daemon.startDaemon).toHaveBeenCalled();
});

test('start command passes configPath when --config flag provided', async () => {
  await runCli(['start', '--config', '/etc/portwatch.json']);
  expect(daemon.startDaemon).toHaveBeenCalledWith({ configPath: '/etc/portwatch.json' });
});

test('stop command calls stopDaemon', async () => {
  await runCli(['stop']);
  expect(daemon.stopDaemon).toHaveBeenCalled();
});

test('status command calls getDaemonState', async () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runCli(['status']);
  expect(daemon.getDaemonState).toHaveBeenCalled();
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('running'));
});

test('unknown command exits with code 1', async () => {
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  await expect(runCli(['unknown'])).rejects.toThrow('exit');
  expect(exitSpy).toHaveBeenCalledWith(1);
});
