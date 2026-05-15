import { CircuitBreaker, CircuitBreakerConfig, CircuitState, CircuitStore } from './circuit.types';

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  cooldownMs: 30_000,
};

export function createCircuitStore(config: Partial<CircuitBreakerConfig> = {}): CircuitStore {
  return {
    breakers: {},
    config: { ...DEFAULT_CONFIG, ...config },
  };
}

function getOrCreate(store: CircuitStore, key: string): CircuitBreaker {
  if (!store.breakers[key]) {
    store.breakers[key] = {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailureAt: null,
      openedAt: null,
    };
  }
  return store.breakers[key];
}

export function getCircuitState(store: CircuitStore, key: string): CircuitState {
  const breaker = store.breakers[key];
  if (!breaker) return 'closed';

  if (breaker.state === 'open') {
    const elapsed = Date.now() - (breaker.openedAt ?? 0);
    if (elapsed >= store.config.cooldownMs) {
      breaker.state = 'half-open';
      breaker.successes = 0;
    }
  }

  return breaker.state;
}

export function recordCircuitSuccess(store: CircuitStore, key: string): void {
  const breaker = getOrCreate(store, key);
  const state = getCircuitState(store, key);

  if (state === 'half-open') {
    breaker.successes += 1;
    if (breaker.successes >= store.config.successThreshold) {
      breaker.state = 'closed';
      breaker.failures = 0;
      breaker.successes = 0;
      breaker.openedAt = null;
    }
  } else if (state === 'closed') {
    breaker.failures = 0;
  }
}

export function recordCircuitFailure(store: CircuitStore, key: string): void {
  const breaker = getOrCreate(store, key);
  breaker.lastFailureAt = Date.now();

  const state = getCircuitState(store, key);

  if (state === 'half-open') {
    breaker.state = 'open';
    breaker.openedAt = Date.now();
    breaker.successes = 0;
    return;
  }

  if (state === 'closed') {
    breaker.failures += 1;
    if (breaker.failures >= store.config.failureThreshold) {
      breaker.state = 'open';
      breaker.openedAt = Date.now();
    }
  }
}

export function isCircuitOpen(store: CircuitStore, key: string): boolean {
  return getCircuitState(store, key) === 'open';
}

export function resetCircuit(store: CircuitStore, key: string): void {
  delete store.breakers[key];
}
