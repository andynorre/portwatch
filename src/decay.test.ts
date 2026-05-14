import {
  createDecayStore,
  decayedWeight,
  recordDecay,
  getDecayedWeight,
  pruneDecayed,
  rankByWeight,
} from './decay';
import { DecayConfig } from './decay.types';

const cfg: DecayConfig = { halfLifeMs: 1000, minWeight: 0.1, maxWeight: 10 };

describe('createDecayStore', () => {
  it('initialises with empty entries', () => {
    const store = createDecayStore(cfg);
    expect(store.entries.size).toBe(0);
    expect(store.config).toBe(cfg);
  });
});

describe('decayedWeight', () => {
  it('returns original weight immediately after insertion', () => {
    const now = Date.now();
    const entry = { key: 'a', weight: 4, lastSeenAt: now };
    expect(decayedWeight(entry, cfg, now)).toBeCloseTo(4);
  });

  it('halves weight after one half-life', () => {
    const now = 2000;
    const entry = { key: 'a', weight: 4, lastSeenAt: 1000 };
    expect(decayedWeight(entry, cfg, now)).toBeCloseTo(2);
  });

  it('quarters weight after two half-lives', () => {
    const now = 3000;
    const entry = { key: 'a', weight: 4, lastSeenAt: 1000 };
    expect(decayedWeight(entry, cfg, now)).toBeCloseTo(1);
  });
});

describe('recordDecay', () => {
  it('creates a new entry with boost weight', () => {
    const store = createDecayStore(cfg);
    const entry = recordDecay(store, 'port:80', 2, 1000);
    expect(entry.weight).toBeCloseTo(2);
    expect(store.entries.has('port:80')).toBe(true);
  });

  it('accumulates weight on repeated observations', () => {
    const store = createDecayStore(cfg);
    recordDecay(store, 'port:80', 3, 1000);
    const entry = recordDecay(store, 'port:80', 3, 1000); // no time elapsed
    expect(entry.weight).toBeCloseTo(6);
  });

  it('caps weight at maxWeight', () => {
    const store = createDecayStore(cfg);
    recordDecay(store, 'x', 8, 1000);
    const entry = recordDecay(store, 'x', 8, 1000);
    expect(entry.weight).toBe(cfg.maxWeight);
  });

  it('applies decay to existing weight before adding boost', () => {
    const store = createDecayStore(cfg);
    recordDecay(store, 'port:443', 4, 1000);  // weight=4
    const entry = recordDecay(store, 'port:443', 1, 2000); // after 1 half-life: 2+1=3
    expect(entry.weight).toBeCloseTo(3);
  });
});

describe('getDecayedWeight', () => {
  it('returns 0 for unknown key', () => {
    const store = createDecayStore(cfg);
    expect(getDecayedWeight(store, 'missing', 1000)).toBe(0);
  });

  it('returns decayed weight for known key', () => {
    const store = createDecayStore(cfg);
    recordDecay(store, 'k', 4, 1000);
    expect(getDecayedWeight(store, 'k', 2000)).toBeCloseTo(2);
  });
});

describe('pruneDecayed', () => {
  it('removes entries below minWeight', () => {
    const store = createDecayStore(cfg);
    recordDecay(store, 'old', 0.5, 0);   // will decay well below 0.1 by now
    recordDecay(store, 'fresh', 5, Date.now());
    const pruned = pruneDecayed(store, Date.now() + 10_000);
    expect(pruned).toBeGreaterThanOrEqual(1);
    expect(store.entries.has('fresh')).toBe(true);
  });

  it('returns 0 when nothing to prune', () => {
    const store = createDecayStore(cfg);
    recordDecay(store, 'k', 5, Date.now());
    expect(pruneDecayed(store, Date.now())).toBe(0);
  });
});

describe('rankByWeight', () => {
  it('returns entries sorted by decayed weight descending', () => {
    const now = 5000;
    const store = createDecayStore(cfg);
    recordDecay(store, 'low', 1, now);
    recordDecay(store, 'high', 8, now);
    recordDecay(store, 'mid', 4, now);
    const ranked = rankByWeight(store, now);
    expect(ranked[0].key).toBe('high');
    expect(ranked[1].key).toBe('mid');
    expect(ranked[2].key).toBe('low');
  });
});
