import type { SamplerConfig, SamplerState, SamplerMode } from './sampler.types';

const DEFAULT_CONFIG: SamplerConfig = {
  mode: 'adaptive',
  intervalMs: 5000,
  minIntervalMs: 1000,
  maxIntervalMs: 60000,
  backoffFactor: 1.5,
  cooldownFactor: 0.75,
};

export function createSamplerState(config: Partial<SamplerConfig> = {}): {
  config: SamplerConfig;
  state: SamplerState;
} {
  const merged: SamplerConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    config: merged,
    state: {
      currentIntervalMs: merged.intervalMs,
      lastSampleAt: null,
      consecutiveNoChange: 0,
      consecutiveChange: 0,
    },
  };
}

export function recordSamplerResult(
  state: SamplerState,
  config: SamplerConfig,
  changed: boolean
): SamplerState {
  const now = Date.now();

  if (config.mode === 'fixed') {
    return {
      ...state,
      lastSampleAt: now,
      consecutiveNoChange: 0,
      consecutiveChange: 0,
      currentIntervalMs: config.intervalMs,
    };
  }

  if (changed) {
    const next = Math.max(
      config.minIntervalMs,
      Math.floor(state.currentIntervalMs * config.cooldownFactor)
    );
    return {
      currentIntervalMs: next,
      lastSampleAt: now,
      consecutiveNoChange: 0,
      consecutiveChange: state.consecutiveChange + 1,
    };
  } else {
    const next = Math.min(
      config.maxIntervalMs,
      Math.floor(state.currentIntervalMs * config.backoffFactor)
    );
    return {
      currentIntervalMs: next,
      lastSampleAt: now,
      consecutiveNoChange: state.consecutiveNoChange + 1,
      consecutiveChange: 0,
    };
  }
}

export function isDueSample(state: SamplerState): boolean {
  if (state.lastSampleAt === null) return true;
  return Date.now() - state.lastSampleAt >= state.currentIntervalMs;
}

export function resetSampler(state: SamplerState, config: SamplerConfig): SamplerState {
  return {
    currentIntervalMs: config.intervalMs,
    lastSampleAt: null,
    consecutiveNoChange: 0,
    consecutiveChange: 0,
  };
}
