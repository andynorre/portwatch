export interface RateLimitRule {
  key: string;
  maxEvents: number;
  windowMs: number;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface RateLimitStore {
  entries: Record<string, RateLimitEntry>;
  rules: Record<string, RateLimitRule>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
