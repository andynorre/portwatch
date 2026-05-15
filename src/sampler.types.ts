export type SamplerMode = 'fixed' | 'adaptive';

export interface SamplerConfig {
  mode: SamplerMode;
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  backoffFactor: number;
  cooldownFactor: number;
}

export interface SamplerState {
  currentIntervalMs: number;
  lastSampleAt: number | null;
  consecutiveNoChange: number;
  consecutiveChange: number;
}
