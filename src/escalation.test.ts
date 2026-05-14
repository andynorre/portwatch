import {
  createEscalationStore,
  escalationKey,
  recordEscalation,
  shouldEscalate,
  resetEscalation,
  purgeEscalationEntries,
} from './escalation';
import { EscalationRule } from './escalation.types';

const RULES: EscalationRule[] = [
  { level: 'low',      repeatCount: 1, cooldownMs: 1_000 },
  { level: 'medium',   repeatCount: 3, cooldownMs: 500  },
  { level: 'high',     repeatCount: 5, cooldownMs: 200  },
  { level: 'critical', repeatCount: 8, cooldownMs: 100  },
];

describe('escalationKey', () => {
  it('formats key as protocol:port', () => {
    expect(escalationKey(8080, 'tcp')).toBe('tcp:8080');
  });
});

describe('createEscalationStore', () => {
  it('creates empty store with default rules', () => {
    const store = createEscalationStore();
    expect(store.entries).toEqual({});
    expect(store.rules.length).toBeGreaterThan(0);
  });

  it('accepts custom rules', () => {
    const store = createEscalationStore(RULES);
    expect(store.rules).toBe(RULES);
  });
});

describe('recordEscalation', () => {
  it('creates new entry at low level on first call', () => {
    const store = createEscalationStore(RULES);
    const entry = recordEscalation(store, 'tcp:80', 1000);
    expect(entry.count).toBe(1);
    expect(entry.level).toBe('low');
  });

  it('escalates level as count increases', () => {
    const store = createEscalationStore(RULES);
    recordEscalation(store, 'tcp:80', 1000);
    recordEscalation(store, 'tcp:80', 2000);
    const entry = recordEscalation(store, 'tcp:80', 3000);
    expect(entry.level).toBe('medium');
  });

  it('reaches critical after enough repeats', () => {
    const store = createEscalationStore(RULES);
    for (let i = 0; i < 8; i++) recordEscalation(store, 'tcp:443', i * 100);
    expect(store.entries['tcp:443'].level).toBe('critical');
  });
});

describe('shouldEscalate', () => {
  it('returns true when no entry exists', () => {
    const store = createEscalationStore(RULES);
    expect(shouldEscalate(store, 'tcp:9000', 0)).toBe(true);
  });

  it('returns false within cooldown window', () => {
    const store = createEscalationStore(RULES);
    recordEscalation(store, 'tcp:80', 1000);
    expect(shouldEscalate(store, 'tcp:80', 1500)).toBe(false);
  });

  it('returns true after cooldown expires', () => {
    const store = createEscalationStore(RULES);
    recordEscalation(store, 'tcp:80', 1000);
    expect(shouldEscalate(store, 'tcp:80', 3000)).toBe(true);
  });
});

describe('resetEscalation', () => {
  it('removes entry from store', () => {
    const store = createEscalationStore(RULES);
    recordEscalation(store, 'tcp:80', 1000);
    resetEscalation(store, 'tcp:80');
    expect(store.entries['tcp:80']).toBeUndefined();
  });
});

describe('purgeEscalationEntries', () => {
  it('removes stale entries and returns count', () => {
    const store = createEscalationStore(RULES);
    recordEscalation(store, 'tcp:80',   1000);
    recordEscalation(store, 'tcp:443', 9000);
    const removed = purgeEscalationEntries(store, 5000, 10000);
    expect(removed).toBe(1);
    expect(store.entries['tcp:80']).toBeUndefined();
    expect(store.entries['tcp:443']).toBeDefined();
  });
});
