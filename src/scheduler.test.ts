import {
  startScheduler,
  stopScheduler,
  getSchedulerState,
  resetScheduler,
} from './scheduler';

beforeEach(() => {
  resetScheduler();
  jest.useFakeTimers();
});

afterEach(() => {
  resetScheduler();
  jest.useRealTimers();
});

describe('startScheduler', () => {
  it('sets running state to true', () => {
    startScheduler(jest.fn(), { intervalMs: 1000 });
    expect(getSchedulerState().running).toBe(true);
  });

  it('throws if already running', () => {
    startScheduler(jest.fn(), { intervalMs: 1000 });
    expect(() => startScheduler(jest.fn(), { intervalMs: 1000 })).toThrow(
      'Scheduler is already running'
    );
  });

  it('throws for non-positive intervalMs', () => {
    expect(() => startScheduler(jest.fn(), { intervalMs: 0 })).toThrow(
      'intervalMs must be a positive number'
    );
  });

  it('throws for negative intervalMs', () => {
    expect(() => startScheduler(jest.fn(), { intervalMs: -100 })).toThrow(
      'intervalMs must be a positive number'
    );
  });

  it('invokes callback on each interval tick', () => {
    const cb = jest.fn().mockResolvedValue(undefined);
    startScheduler(cb, { intervalMs: 500 });
    jest.advanceTimersByTime(1500);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('invokes callback immediately when immediate=true', () => {
    const cb = jest.fn().mockResolvedValue(undefined);
    startScheduler(cb, { intervalMs: 1000, immediate: true });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('stops after maxRuns', () => {
    const cb = jest.fn().mockResolvedValue(undefined);
    startScheduler(cb, { intervalMs: 500, maxRuns: 2 });
    jest.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(getSchedulerState().running).toBe(false);
  });

  it('increments runCount on each tick', () => {
    const cb = jest.fn().mockResolvedValue(undefined);
    startScheduler(cb, { intervalMs: 500 });
    jest.advanceTimersByTime(1000);
    expect(getSchedulerState().runCount).toBe(2);
  });

  it('resets runCount to 0 after resetScheduler', () => {
    const cb = jest.fn().mockResolvedValue(undefined);
    startScheduler(cb, { intervalMs: 500 });
    jest.advanceTimersByTime(1000);
    resetScheduler();
    expect(getSchedulerState().runCount).toBe(0);
  });
});

describe('stopScheduler', () => {
  it('sets running to false', () => {
    startScheduler(jest.fn(), { intervalMs: 1000 });
    stopScheduler();
    expect(getSchedulerState().running).toBe(false);
  });

  it('stops invoking the callback after stop', () => {
    const cb = jest.fn().mockResolvedValue(undefined);
    startScheduler(cb, { intervalMs: 500 });
    jest.advanceTimersByTime(500);
    stopScheduler();
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not throw when called while not running', () => {
    expect(() => stopScheduler()).not.toThrow();
  });
});
