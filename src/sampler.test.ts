import {
  createSamplerState,
  recordSamplerResult,
  isDueSample,
  resetSampler,
} from './sampler';

describe('createSamplerState', () => {
  it('uses default config when none provided', () => {
    const { config, state } = createSamplerState();
    expect(config.mode).toBe('adaptive');
    expect(state.currentIntervalMs).toBe(config.intervalMs);
    expect(state.lastSampleAt).toBeNull();
  });

  it('merges partial config', () => {
    const { config } = createSamplerState({ intervalMs: 2000, mode: 'fixed' });
    expect(config.intervalMs).toBe(2000);
    expect(config.mode).toBe('fixed');
    expect(config.minIntervalMs).toBe(1000);
  });
});

describe('recordSamplerResult', () => {
  it('keeps fixed interval regardless of change', () => {
    const { config, state } = createSamplerState({ mode: 'fixed', intervalMs: 3000 });
    const next = recordSamplerResult(state, config, true);
    expect(next.currentIntervalMs).toBe(3000);
    const next2 = recordSamplerResult(state, config, false);
    expect(next2.currentIntervalMs).toBe(3000);
  });

  it('backs off interval when no change in adaptive mode', () => {
    const { config, state } = createSamplerState({
      mode: 'adaptive',
      intervalMs: 5000,
      backoffFactor: 2,
      maxIntervalMs: 60000,
    });
    const next = recordSamplerResult(state, config, false);
    expect(next.currentIntervalMs).toBe(10000);
    expect(next.consecutiveNoChange).toBe(1);
    expect(next.consecutiveChange).toBe(0);
  });

  it('reduces interval on change in adaptive mode', () => {
    const { config, state } = createSamplerState({
      mode: 'adaptive',
      intervalMs: 10000,
      cooldownFactor: 0.5,
      minIntervalMs: 1000,
    });
    const next = recordSamplerResult(state, config, true);
    expect(next.currentIntervalMs).toBe(5000);
    expect(next.consecutiveChange).toBe(1);
    expect(next.consecutiveNoChange).toBe(0);
  });

  it('clamps interval to minIntervalMs', () => {
    const { config, state } = createSamplerState({
      mode: 'adaptive',
      intervalMs: 1000,
      minIntervalMs: 1000,
      cooldownFactor: 0.1,
    });
    const next = recordSamplerResult(state, config, true);
    expect(next.currentIntervalMs).toBe(1000);
  });

  it('clamps interval to maxIntervalMs', () => {
    const { config, state } = createSamplerState({
      mode: 'adaptive',
      intervalMs: 50000,
      maxIntervalMs: 60000,
      backoffFactor: 2,
    });
    const next = recordSamplerResult(state, config, false);
    expect(next.currentIntervalMs).toBe(60000);
  });
});

describe('isDueSample', () => {
  it('returns true when lastSampleAt is null', () => {
    const { state } = createSamplerState();
    expect(isDueSample(state)).toBe(true);
  });

  it('returns false when sampled recently', () => {
    const { config, state } = createSamplerState({ intervalMs: 60000 });
    const recent = recordSamplerResult(state, config, false);
    expect(isDueSample(recent)).toBe(false);
  });
});

describe('resetSampler', () => {
  it('resets state to initial values', () => {
    const { config, state } = createSamplerState({ intervalMs: 5000 });
    const changed = recordSamplerResult(state, config, false);
    const reset = resetSampler(changed, config);
    expect(reset.currentIntervalMs).toBe(5000);
    expect(reset.lastSampleAt).toBeNull();
    expect(reset.consecutiveNoChange).toBe(0);
  });
});
