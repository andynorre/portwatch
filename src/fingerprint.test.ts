import {
  createFingerprintStore,
  computeFingerprint,
  buildFingerprint,
  upsertFingerprint,
  getFingerprint,
  removeFingerprint,
  listFingerprints,
} from './fingerprint';
import { PortEntry } from './scanner';

const makeEntry = (overrides: Partial<PortEntry> = {}): PortEntry => ({
  port: 8080,
  protocol: 'tcp',
  process: 'node',
  user: 'alice',
  pid: 1234,
  ...overrides,
});

describe('computeFingerprint', () => {
  it('returns a 16-char hex string', () => {
    const fp = computeFingerprint(makeEntry());
    expect(fp).toMatch(/^[0-9a-f]{16}$/);
  });

  it('produces the same value for identical entries', () => {
    expect(computeFingerprint(makeEntry())).toBe(computeFingerprint(makeEntry()));
  });

  it('differs when process changes', () => {
    const a = computeFingerprint(makeEntry({ process: 'node' }));
    const b = computeFingerprint(makeEntry({ process: 'python' }));
    expect(a).not.toBe(b);
  });
});

describe('buildFingerprint', () => {
  it('maps entry fields correctly', () => {
    const entry = makeEntry();
    const fp = buildFingerprint(entry);
    expect(fp.port).toBe(8080);
    expect(fp.protocol).toBe('tcp');
    expect(fp.process).toBe('node');
    expect(fp.user).toBe('alice');
    expect(fp.fingerprint).toHaveLength(16);
    expect(fp.seenAt).toBeGreaterThan(0);
  });
});

describe('upsertFingerprint', () => {
  it('marks changed=true on first insert', () => {
    const store = createFingerprintStore();
    const { changed } = upsertFingerprint(store, makeEntry());
    expect(changed).toBe(true);
  });

  it('marks changed=false when entry is identical', () => {
    const store = createFingerprintStore();
    upsertFingerprint(store, makeEntry());
    const { changed } = upsertFingerprint(store, makeEntry());
    expect(changed).toBe(false);
  });

  it('marks changed=true when process differs', () => {
    const store = createFingerprintStore();
    upsertFingerprint(store, makeEntry({ process: 'node' }));
    const { changed } = upsertFingerprint(store, makeEntry({ process: 'python' }));
    expect(changed).toBe(true);
  });
});

describe('getFingerprint / removeFingerprint / listFingerprints', () => {
  it('retrieves an existing fingerprint', () => {
    const store = createFingerprintStore();
    upsertFingerprint(store, makeEntry());
    const fp = getFingerprint(store, 8080, 'tcp');
    expect(fp).toBeDefined();
    expect(fp?.port).toBe(8080);
  });

  it('returns undefined for unknown port', () => {
    const store = createFingerprintStore();
    expect(getFingerprint(store, 9999, 'tcp')).toBeUndefined();
  });

  it('removes a fingerprint', () => {
    const store = createFingerprintStore();
    upsertFingerprint(store, makeEntry());
    expect(removeFingerprint(store, 8080, 'tcp')).toBe(true);
    expect(getFingerprint(store, 8080, 'tcp')).toBeUndefined();
  });

  it('lists all fingerprints', () => {
    const store = createFingerprintStore();
    upsertFingerprint(store, makeEntry({ port: 80 }));
    upsertFingerprint(store, makeEntry({ port: 443 }));
    expect(listFingerprints(store)).toHaveLength(2);
  });
});
