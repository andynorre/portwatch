import {
  createCircuitStore,
  getCircuitState,
  isCircuitOpen,
  recordCircuitFailure,
  recordCircuitSuccess,
  resetCircuit,
} from './circuit';

const KEY = 'notifier:desktop';

describe('createCircuitStore', () => {
  it('creates store with default config', () => {
    const store = createCircuitStore();
    expect(store.config.failureThreshold).toBe(5);
    expect(store.config.successThreshold).toBe(2);
    expect(store.breakers).toEqual({});
  });

  it('merges custom config', () => {
    const store = createCircuitStore({ failureThreshold: 3 });
    expect(store.config.failureThreshold).toBe(3);
    expect(store.config.successThreshold).toBe(2);
  });
});

describe('getCircuitState', () => {
  it('returns closed for unknown key', () => {
    const store = createCircuitStore();
    expect(getCircuitState(store, KEY)).toBe('closed');
  });

  it('transitions open -> half-open after cooldown', () => {
    const store = createCircuitStore({ cooldownMs: 0 });
    for (let i = 0; i < 5; i++) recordCircuitFailure(store, KEY);
    expect(getCircuitState(store, KEY)).toBe('half-open');
  });
});

describe('recordCircuitFailure', () => {
  it('opens circuit after reaching failure threshold', () => {
    const store = createCircuitStore({ failureThreshold: 3 });
    recordCircuitFailure(store, KEY);
    recordCircuitFailure(store, KEY);
    expect(isCircuitOpen(store, KEY)).toBe(false);
    recordCircuitFailure(store, KEY);
    expect(isCircuitOpen(store, KEY)).toBe(true);
  });

  it('re-opens circuit on failure during half-open', () => {
    const store = createCircuitStore({ failureThreshold: 2, cooldownMs: 0 });
    recordCircuitFailure(store, KEY);
    recordCircuitFailure(store, KEY);
    // triggers half-open due to cooldownMs: 0
    getCircuitState(store, KEY);
    recordCircuitFailure(store, KEY);
    expect(store.breakers[KEY].state).toBe('open');
  });
});

describe('recordCircuitSuccess', () => {
  it('closes circuit after sufficient successes in half-open', () => {
    const store = createCircuitStore({ failureThreshold: 2, successThreshold: 2, cooldownMs: 0 });
    recordCircuitFailure(store, KEY);
    recordCircuitFailure(store, KEY);
    getCircuitState(store, KEY); // -> half-open
    recordCircuitSuccess(store, KEY);
    expect(store.breakers[KEY].state).toBe('half-open');
    recordCircuitSuccess(store, KEY);
    expect(store.breakers[KEY].state).toBe('closed');
  });

  it('resets failure count on success in closed state', () => {
    const store = createCircuitStore({ failureThreshold: 3 });
    recordCircuitFailure(store, KEY);
    recordCircuitFailure(store, KEY);
    recordCircuitSuccess(store, KEY);
    expect(store.breakers[KEY].failures).toBe(0);
  });
});

describe('resetCircuit', () => {
  it('removes the breaker entry', () => {
    const store = createCircuitStore();
    recordCircuitFailure(store, KEY);
    resetCircuit(store, KEY);
    expect(store.breakers[KEY]).toBeUndefined();
  });
});
