import {
  createTagStore,
  addTagRule,
  removeTagRule,
  tagPort,
  tagPorts,
  getPortsWithTag,
  matchesTagRule,
} from './tag';
import { PortInfo } from './baseline.types';

function makePort(overrides: Partial<PortInfo> = {}): PortInfo {
  return {
    port: 8080,
    protocol: 'tcp',
    process: 'node',
    pid: 1234,
    state: 'LISTEN',
    ...overrides,
  };
}

describe('createTagStore', () => {
  it('creates an empty store', () => {
    const store = createTagStore();
    expect(store.rules).toHaveLength(0);
  });

  it('creates a store with initial rules', () => {
    const store = createTagStore([{ tag: 'web', portRange: [80, 8080] }]);
    expect(store.rules).toHaveLength(1);
  });
});

describe('addTagRule / removeTagRule', () => {
  it('adds a rule immutably', () => {
    const s1 = createTagStore();
    const s2 = addTagRule(s1, { tag: 'db', portRange: [5432, 5432] });
    expect(s1.rules).toHaveLength(0);
    expect(s2.rules).toHaveLength(1);
  });

  it('removes rules by tag', () => {
    const store = createTagStore([
      { tag: 'web' },
      { tag: 'db' },
    ]);
    const updated = removeTagRule(store, 'web');
    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0].tag).toBe('db');
  });
});

describe('matchesTagRule', () => {
  it('matches by port range', () => {
    const port = makePort({ port: 443 });
    expect(matchesTagRule(port, { tag: 'tls', portRange: [443, 443] })).toBe(true);
    expect(matchesTagRule(port, { tag: 'tls', portRange: [80, 80] })).toBe(false);
  });

  it('matches by protocol', () => {
    const port = makePort({ protocol: 'udp' });
    expect(matchesTagRule(port, { tag: 'udp-only', protocols: ['udp'] })).toBe(true);
    expect(matchesTagRule(port, { tag: 'tcp-only', protocols: ['tcp'] })).toBe(false);
  });

  it('matches by process pattern', () => {
    const port = makePort({ process: 'nginx-worker' });
    expect(matchesTagRule(port, { tag: 'nginx', processPatterns: ['nginx'] })).toBe(true);
    expect(matchesTagRule(port, { tag: 'apache', processPatterns: ['apache'] })).toBe(false);
  });

  it('matches when no constraints set', () => {
    expect(matchesTagRule(makePort(), { tag: 'all' })).toBe(true);
  });
});

describe('tagPort', () => {
  it('returns all matching tags', () => {
    const store = createTagStore([
      { tag: 'http', portRange: [8080, 8080] },
      { tag: 'node', processPatterns: ['node'] },
      { tag: 'db', portRange: [5432, 5432] },
    ]);
    const tags = tagPort(makePort({ port: 8080, process: 'node' }), store);
    expect(tags).toContain('http');
    expect(tags).toContain('node');
    expect(tags).not.toContain('db');
  });
});

describe('tagPorts', () => {
  it('returns a map of port to tags', () => {
    const store = createTagStore([{ tag: 'web', portRange: [80, 8080] }]);
    const ports = [makePort({ port: 80 }), makePort({ port: 9000 })];
    const result = tagPorts(ports, store);
    expect(result.get(ports[0])).toContain('web');
    expect(result.get(ports[1])).not.toContain('web');
  });
});

describe('getPortsWithTag', () => {
  it('filters ports matching a specific tag', () => {
    const store = createTagStore([{ tag: 'secure', portRange: [443, 443] }]);
    const ports = [makePort({ port: 443 }), makePort({ port: 80 })];
    const secure = getPortsWithTag(ports, store, 'secure');
    expect(secure).toHaveLength(1);
    expect(secure[0].port).toBe(443);
  });
});
