import {
  startScheduler,
  stopScheduler,
  getSchedulerState,
  resetScheduler,
} from './scheduler';
import { scanPorts } from './scanner';
import { loadBaseline, diffPorts } from './baseline';
import { buildAlerts } from './alerter';

jest.mock('./scanner');
jest.mock('./baseline');
jest.mock('./alerter');

const mockScanPorts = scanPorts as jest.MockedFunction<typeof scanPorts>;
const mockLoadBaseline = loadBaseline as jest.MockedFunction<typeof loadBaseline>;
const mockBuildAlerts = buildAlerts as jest.MockedFunction<typeof buildAlerts>;
const mockDiffPorts = diffPorts as jest.MockedFunction<typeof diffPorts>;

beforeEach(() => {
  resetScheduler();
  jest.useFakeTimers();
  mockScanPorts.mockResolvedValue([]);
  mockLoadBaseline.mockReturnValue([]);
  mockDiffPorts.mockReturnValue({ added: [], removed: [] });
  mockBuildAlerts.mockReturnValue([]);
});

afterEach(() => {
  resetScheduler();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('scheduler integration with scan pipeline', () => {
  it('runs scan pipeline on each tick', async () => {
    const pipeline = async () => {
      const ports = await scanPorts();
      const baseline = loadBaseline('baseline.json');
      const diff = diffPorts(baseline, ports);
      buildAlerts(diff);
    };

    startScheduler(pipeline, { intervalMs: 1000 });
    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(mockScanPorts).toHaveBeenCalledTimes(3);
    expect(mockLoadBaseline).toHaveBeenCalledTimes(3);
    expect(mockBuildAlerts).toHaveBeenCalledTimes(3);
  });

  it('continues running after a callback error', async () => {
    let callCount = 0;
    const flakyPipeline = async () => {
      callCount += 1;
      if (callCount === 1) throw new Error('scan failed');
      await scanPorts();
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    startScheduler(flakyPipeline, { intervalMs: 500 });
    jest.advanceTimersByTime(1500);
    await Promise.resolve();

    expect(callCount).toBe(3);
    expect(getSchedulerState().running).toBe(true);
    consoleSpy.mockRestore();
  });
});
