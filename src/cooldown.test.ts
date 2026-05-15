import {
  createCooldownStore,
  cooldownKey,
  checkCooldown,
  recordCooldown,
  purgeCooldowns,
  resetCooldown,
} from './cooldown';

const NOW = 1_700_000_000_000;

describe('cooldownKey', () => {
  it('formats key as protocol:port', () => {
    expect(cooldownKey(8080, 'tcp')).toBe('tcp:8080');
  });
});

describe('createCooldownStore', () => {
  it('uses provided config values', () => {
    const store = createCooldownStore(10_000, 3, 60_000);
    expect(store.windowMs).toBe(10_000);
    expect(store.maxCount).toBe(3);
    expect(store.cooldownMs).toBe(60_000);
  });
});

describe('checkCooldown', () => {
  it('allows unknown keys', () => {
    const store = createCooldownStore();
    const result = checkCooldown(store, 'tcp:80', NOW);
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(0);
  });

  it('blocks keys that are currently cooling', () => {
    const store = createCooldownStore(60_000, 2, 300_000);
    recordCooldown(store, 'tcp:80', NOW);
    recordCooldown(store, 'tcp:80', NOW + 1000);
    const result = checkCooldown(store, 'tcp:80', NOW + 2000);
    expect(result.allowed).toBe(false);
    expect(result.coolingUntil).toBeGreaterThan(NOW);
  });
});

describe('recordCooldown', () => {
  it('allows events below maxCount', () => {
    const store = createCooldownStore(60_000, 3, 300_000);
    const r1 = recordCooldown(store, 'tcp:443', NOW);
    const r2 = recordCooldown(store, 'tcp:443', NOW + 500);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.count).toBe(2);
  });

  it('triggers cooldown when maxCount reached', () => {
    const store = createCooldownStore(60_000, 2, 300_000);
    recordCooldown(store, 'tcp:443', NOW);
    const r = recordCooldown(store, 'tcp:443', NOW + 100);
    expect(r.allowed).toBe(false);
    expect(r.coolingUntil).toBe(NOW + 100 + 300_000);
  });

  it('resets window after windowMs has elapsed', () => {
    const store = createCooldownStore(60_000, 2, 300_000);
    recordCooldown(store, 'tcp:443', NOW);
    const r = recordCooldown(store, 'tcp:443', NOW + 70_000);
    expect(r.allowed).toBe(true);
    expect(r.count).toBe(1);
  });
});

describe('purgeCooldowns', () => {
  it('removes stale entries', () => {
    const store = createCooldownStore(60_000, 2, 300_000);
    recordCooldown(store, 'tcp:22', NOW);
    const removed = purgeCooldowns(store, NOW + 400_000);
    expect(removed).toBe(1);
    expect(store.entries['tcp:22']).toBeUndefined();
  });

  it('keeps active cooling entries', () => {
    const store = createCooldownStore(60_000, 2, 300_000);
    recordCooldown(store, 'tcp:22', NOW);
    recordCooldown(store, 'tcp:22', NOW + 100);
    const removed = purgeCooldowns(store, NOW + 1000);
    expect(removed).toBe(0);
  });
});

describe('resetCooldown', () => {
  it('removes an existing entry and returns true', () => {
    const store = createCooldownStore();
    recordCooldown(store, 'udp:53', NOW);
    expect(resetCooldown(store, 'udp:53')).toBe(true);
    expect(store.entries['udp:53']).toBeUndefined();
  });

  it('returns false for unknown key', () => {
    const store = createCooldownStore();
    expect(resetCooldown(store, 'udp:53')).toBe(false);
  });
});
