export type TrendDirection = 'rising' | 'falling' | 'stable';

export interface TrendPoint {
  timestamp: number;
  portCount: number;
  alertCount: number;
}

export interface TrendSummary {
  direction: TrendDirection;
  portCountDelta: number;
  alertCountDelta: number;
  windowMs: number;
  points: TrendPoint[];
}

export interface TrendStore {
  points: TrendPoint[];
  maxPoints: number;
}
