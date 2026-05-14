import {
  createEscalationStore,
  escalationKey,
  recordEscalation,
  shouldEscalate,
  purgeEscalationEntries,
} from './escalation';
import { EscalationRule } from './escalation.types';

const FAST_RULES: EscalationRule[] = [
  { level: 'low',      repeatCount: 1, cooldownMs: 100 },
  { level: 'medium',   repeatCount: 2, cooldownMs: 50  },
  { level: 'high',     repeatCount: 4, cooldownMs: 20  },
  { level: 'critical', repeatCount: 6, cooldownMs: 10  },
];

describe('escalation integration', () => {
  it('full escalation lifecycle for a port', () => {
    const store = createEscalationStore(FAST_RULES);
    const key = escalationKey(3000, 'tcp');

    // First alert — low
    let entry = recordEscalation(store, key, 0);
    expect(entry.level).toBe('low');
    expect(shouldEscalate(store, key, 50)).toBe(false);
    expect(shouldEscalate(store, key, 200)).toBe(true);

    // Second alert — medium
    entry = recordEscalation(store, key, 200);
    expect(entry.level).toBe('medium');

    // Third and fourth — high
    recordEscalation(store, key, 300);
    entry = recordEscalation(store, key, 400);
    expect(entry.level).toBe('high');

    // Sixth — critical
    recordEscalation(store, key, 500);
    entry = recordEscalation(store, key, 600);
    expect(entry.level).toBe('critical');
    expect(entry.count).toBe(6);
  });

  it('independent escalation tracks for different ports', () => {
    const store = createEscalationStore(FAST_RULES);
    const k1 = escalationKey(80, 'tcp');
    const k2 = escalationKey(443, 'tcp');

    recordEscalation(store, k1, 0);
    recordEscalation(store, k1, 100);
    recordEscalation(store, k2, 0);

    expect(store.entries[k1].level).toBe('medium');
    expect(store.entries[k2].level).toBe('low');
  });

  it('purge clears old entries without affecting recent ones', () => {
    const store = createEscalationStore(FAST_RULES);
    const k1 = escalationKey(8080, 'tcp');
    const k2 = escalationKey(9090, 'udp');

    recordEscalation(store, k1, 0);
    recordEscalation(store, k2, 5000);

    const removed = purgeEscalationEntries(store, 2000, 6000);
    expect(removed).toBe(1);
    expect(store.entries[k2]).toBeDefined();
  });
});
