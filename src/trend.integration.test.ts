import {
  createTrendStore,
  recordTrendPoint,
  computeTrend,
  purgeTrendPoints,
} from './trend';

describe('trend integration', () => {
  it('simulates a full monitoring window cycle', () => {
    let store = createTrendStore(10);
    const base = Date.now() - 10 * 60 * 1000;

    // Simulate 10 readings over 10 minutes
    for (let i = 0; i < 10; i++) {
      store = recordTrendPoint(store, 5 + i, i > 5 ? 1 : 0, base + i * 60000);
    }

    expect(store.points).toHaveLength(10);

    const trend = computeTrend(store, 15 * 60 * 1000);
    expect(trend.direction).toBe('rising');
    expect(trend.portCountDelta).toBe(9);
    expect(trend.points).toHaveLength(10);
  });

  it('purges stale data and recomputes as stable', () => {
    let store = createTrendStore(20);
    const now = Date.now();

    // Add old points
    store = recordTrendPoint(store, 100, 10, now - 3600000);
    store = recordTrendPoint(store, 120, 15, now - 3500000);

    // Add recent stable points
    store = recordTrendPoint(store, 6, 0, now - 2000);
    store = recordTrendPoint(store, 6, 0, now - 1000);

    store = purgeTrendPoints(store, 5 * 60 * 1000);
    expect(store.points).toHaveLength(2);

    const trend = computeTrend(store, 5 * 60 * 1000);
    expect(trend.direction).toBe('stable');
    expect(trend.portCountDelta).toBe(0);
  });

  it('handles maxPoints eviction across many recordings', () => {
    let store = createTrendStore(5);
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      store = recordTrendPoint(store, i, 0, now + i * 1000);
    }
    expect(store.points).toHaveLength(5);
    expect(store.points[0].portCount).toBe(15);
    expect(store.points[4].portCount).toBe(19);
  });
});
