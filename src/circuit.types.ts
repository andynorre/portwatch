export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number | null;
  openedAt: number | null;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;   // failures before opening
  successThreshold: number;   // successes in half-open before closing
  cooldownMs: number;         // ms to wait before half-open probe
}

export interface CircuitStore {
  breakers: Record<string, CircuitBreaker>;
  config: CircuitBreakerConfig;
}
