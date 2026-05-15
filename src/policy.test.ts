import {
  createPolicyStore,
  addPolicyRule,
  removePolicyRule,
  togglePolicyRule,
  evaluatePolicy,
  evaluatePolicies,
} from './policy';
import type { PortInfo } from './baseline.types';

const makePort = (overrides: Partial<PortInfo> = {}): PortInfo => ({
  port: 8080,
  protocol: 'tcp',
  process: 'node',
  user: 'ubuntu',
  pid: 1234,
  ...overrides,
});

describe('createPolicyStore', () => {
  it('creates store with default action', () => {
    const store = createPolicyStore('deny');
    expect(store.defaultAction).toBe('deny');
    expect(store.rules).toHaveLength(0);
  });
});

describe('addPolicyRule', () => {
  it('adds a rule sorted by priority descending', () => {
    let store = createPolicyStore();
    store = addPolicyRule(store, { id: 'r1', name: 'low', field: 'port', pattern: 80, action: 'allow', priority: 1, enabled: true });
    store = addPolicyRule(store, { id: 'r2', name: 'high', field: 'port', pattern: 443, action: 'deny', priority: 10, enabled: true });
    expect(store.rules[0].id).toBe('r2');
    expect(store.rules[1].id).toBe('r1');
  });
});

describe('removePolicyRule', () => {
  it('removes rule by id', () => {
    let store = createPolicyStore();
    store = addPolicyRule(store, { id: 'r1', name: 'test', field: 'port', pattern: 22, action: 'deny', priority: 0, enabled: true });
    store = removePolicyRule(store, 'r1');
    expect(store.rules).toHaveLength(0);
  });
});

describe('togglePolicyRule', () => {
  it('disables a rule', () => {
    let store = createPolicyStore();
    store = addPolicyRule(store, { id: 'r1', name: 'test', field: 'port', pattern: 22, action: 'deny', priority: 0, enabled: true });
    store = togglePolicyRule(store, 'r1', false);
    expect(store.rules[0].enabled).toBe(false);
  });
});

describe('evaluatePolicy', () => {
  it('returns matched rule action for port match', () => {
    let store = createPolicyStore('alert');
    store = addPolicyRule(store, { id: 'r1', name: 'block-22', field: 'port', pattern: 22, action: 'deny', priority: 5, enabled: true });
    const result = evaluatePolicy(store, makePort({ port: 22 }));
    expect(result.action).toBe('deny');
    expect(result.matched).toBe(true);
    expect(result.ruleId).toBe('r1');
  });

  it('returns default action when no rule matches', () => {
    const store = createPolicyStore('allow');
    const result = evaluatePolicy(store, makePort({ port: 9999 }));
    expect(result.action).toBe('allow');
    expect(result.matched).toBe(false);
  });

  it('skips disabled rules', () => {
    let store = createPolicyStore('alert');
    store = addPolicyRule(store, { id: 'r1', name: 'block-22', field: 'port', pattern: 22, action: 'deny', priority: 5, enabled: false });
    const result = evaluatePolicy(store, makePort({ port: 22 }));
    expect(result.matched).toBe(false);
    expect(result.action).toBe('alert');
  });

  it('matches by process substring', () => {
    let store = createPolicyStore();
    store = addPolicyRule(store, { id: 'r1', name: 'allow-node', field: 'process', pattern: 'node', action: 'allow', priority: 1, enabled: true });
    const result = evaluatePolicy(store, makePort({ process: 'nodejs' }));
    expect(result.action).toBe('allow');
  });
});

describe('evaluatePolicies', () => {
  it('returns a map of results for each port', () => {
    let store = createPolicyStore('alert');
    store = addPolicyRule(store, { id: 'r1', name: 'deny-22', field: 'port', pattern: 22, action: 'deny', priority: 1, enabled: true });
    const ports = [makePort({ port: 22 }), makePort({ port: 80 })];
    const results = evaluatePolicies(store, ports);
    expect(results.get(ports[0])?.action).toBe('deny');
    expect(results.get(ports[1])?.action).toBe('alert');
  });
});
