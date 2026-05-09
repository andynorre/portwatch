import { TrendStore, TrendPoint, TrendSummary, TrendDirection } from './trend.types';

export function createTrendStore(maxPoints = 60): TrendStore {
  return { points: [], maxPoints };
}

export function recordTrendPoint(
  store: TrendStore,
  portCount: number,
  alertCount: number,
  timestamp = Date.now()
): TrendStore {
  const point: TrendPoint = { timestamp, portCount, alertCount };
  const points = [...store.points, point];
  if (points.length > store.maxPoints) {
    points.splice(0, points.length - store.maxPoints);
  }
  return { ...store, points };
}

export function computeTrend(
  store: TrendStore,
  windowMs = 5 * 60 * 1000
): TrendSummary {
  const now = Date.now();
  const cutoff = now - windowMs;
  const points = store.points.filter((p) => p.timestamp >= cutoff);

  if (points.length < 2) {
    return {
      direction: 'stable',
      portCountDelta: 0,
      alertCountDelta: 0,
      windowMs,
      points,
    };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const portCountDelta = last.portCount - first.portCount;
  const alertCountDelta = last.alertCount - first.alertCount;

  let direction: TrendDirection = 'stable';
  if (portCountDelta > 0 || alertCountDelta > 0) {
    direction = 'rising';
  } else if (portCountDelta < 0 && alertCountDelta <= 0) {
    direction = 'falling';
  }

  return { direction, portCountDelta, alertCountDelta, windowMs, points };
}

export function purgeTrendPoints(
  store: TrendStore,
  olderThanMs: number
): TrendStore {
  const cutoff = Date.now() - olderThanMs;
  return { ...store, points: store.points.filter((p) => p.timestamp >= cutoff) };
}

export function getLatestTrendPoint(store: TrendStore): TrendPoint | null {
  return store.points.length > 0 ? store.points[store.points.length - 1] : null;
}
