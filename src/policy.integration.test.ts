import { buildPolicyStore, validatePolicyConfig } from './policy.config';
import { evaluatePolicy } from './policy';
import type { PortInfo } from './baseline.types';

const makePort = (overrides: Partial<PortInfo> = {}): PortInfo => ({
  port: 8080,
  protocol: 'tcp',
  process: 'nginx',
  user: 'www-data',
  pid: 42,
  ...overrides,
});

describe('policy integration', () => {
  const config = {
    defaultAction: 'alert' as const,
    rules: [
      { id: 'allow-http', name: 'Allow HTTP', field: 'port' as const, pattern: 80, action: 'allow' as const, priority: 10 },
      { id: 'deny-telnet', name: 'Deny Telnet', field: 'port' as const, pattern: 23, action: 'deny' as const, priority: 20 },
      { id: 'deny-root', name: 'Deny Root', field: 'user' as const, pattern: 'root', action: 'deny' as const, priority: 15 },
    ],
  };

  it('validates a well-formed config', () => {
    expect(validatePolicyConfig(config)).toBe(true);
  });

  it('rejects invalid defaultAction', () => {
    expect(validatePolicyConfig({ defaultAction: 'block' })).toBe(false);
  });

  it('builds store and evaluates allow rule', () => {
    const store = buildPolicyStore(config);
    const result = evaluatePolicy(store, makePort({ port: 80 }));
    expect(result.action).toBe('allow');
    expect(result.ruleId).toBe('allow-http');
  });

  it('builds store and evaluates deny rule', () => {
    const store = buildPolicyStore(config);
    const result = evaluatePolicy(store, makePort({ port: 23 }));
    expect(result.action).toBe('deny');
    expect(result.ruleId).toBe('deny-telnet');
  });

  it('higher priority rule wins over lower priority', () => {
    const store = buildPolicyStore(config);
    // deny-root has priority 15, deny-telnet has 20 — root user on port 23 should hit deny-telnet first
    const result = evaluatePolicy(store, makePort({ port: 23, user: 'root' }));
    expect(result.ruleId).toBe('deny-telnet');
  });

  it('falls back to default action when no rule matches', () => {
    const store = buildPolicyStore(config);
    const result = evaluatePolicy(store, makePort({ port: 9999, user: 'nobody' }));
    expect(result.action).toBe('alert');
    expect(result.matched).toBe(false);
  });
});
