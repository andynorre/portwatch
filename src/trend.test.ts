import {
  createTrendStore,
  recordTrendPoint,
  computeTrend,
  purgeTrendPoints,
  getLatestTrendPoint,
} from './trend';

describe('createTrendStore', () => {
  it('creates an empty store with default maxPoints', () => {
    const store = createTrendStore();
    expect(store.points).toHaveLength(0);
    expect(store.maxPoints).toBe(60);
  });

  it('respects custom maxPoints', () => {
    const store = createTrendStore(10);
    expect(store.maxPoints).toBe(10);
  });
});

describe('recordTrendPoint', () => {
  it('appends a point to the store', () => {
    let store = createTrendStore();
    store = recordTrendPoint(store, 5, 1, 1000);
    expect(store.points).toHaveLength(1);
    expect(store.points[0]).toEqual({ timestamp: 1000, portCount: 5, alertCount: 1 });
  });

  it('evicts oldest point when maxPoints is exceeded', () => {
    let store = createTrendStore(2);
    store = recordTrendPoint(store, 1, 0, 1000);
    store = recordTrendPoint(store, 2, 0, 2000);
    store = recordTrendPoint(store, 3, 0, 3000);
    expect(store.points).toHaveLength(2);
    expect(store.points[0].portCount).toBe(2);
  });
});

describe('computeTrend', () => {
  it('returns stable when fewer than 2 points', () => {
    const store = createTrendStore();
    const trend = computeTrend(store);
    expect(trend.direction).toBe('stable');
    expect(trend.portCountDelta).toBe(0);
  });

  it('detects rising trend', () => {
    let store = createTrendStore();
    const now = Date.now();
    store = recordTrendPoint(store, 3, 0, now - 60000);
    store = recordTrendPoint(store, 8, 2, now);
    const trend = computeTrend(store, 120000);
    expect(trend.direction).toBe('rising');
    expect(trend.portCountDelta).toBe(5);
    expect(trend.alertCountDelta).toBe(2);
  });

  it('detects falling trend', () => {
    let store = createTrendStore();
    const now = Date.now();
    store = recordTrendPoint(store, 10, 0, now - 60000);
    store = recordTrendPoint(store, 4, 0, now);
    const trend = computeTrend(store, 120000);
    expect(trend.direction).toBe('falling');
  });

  it('filters points outside the window', () => {
    let store = createTrendStore();
    const now = Date.now();
    store = recordTrendPoint(store, 100, 5, now - 600000);
    store = recordTrendPoint(store, 5, 0, now - 1000);
    store = recordTrendPoint(store, 6, 0, now);
    const trend = computeTrend(store, 60000);
    expect(trend.points).toHaveLength(2);
  });
});

describe('purgeTrendPoints', () => {
  it('removes points older than the given threshold', () => {
    let store = createTrendStore();
    const now = Date.now();
    store = recordTrendPoint(store, 1, 0, now - 10000);
    store = recordTrendPoint(store, 2, 0, now - 1000);
    store = purgeTrendPoints(store, 5000);
    expect(store.points).toHaveLength(1);
    expect(store.points[0].portCount).toBe(2);
  });
});

describe('getLatestTrendPoint', () => {
  it('returns null for empty store', () => {
    expect(getLatestTrendPoint(createTrendStore())).toBeNull();
  });

  it('returns the last recorded point', () => {
    let store = createTrendStore();
    store = recordTrendPoint(store, 3, 0, 1000);
    store = recordTrendPoint(store, 7, 1, 2000);
    const point = getLatestTrendPoint(store);
    expect(point?.portCount).toBe(7);
  });
});
