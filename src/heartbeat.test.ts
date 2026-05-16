import {
  createHeartbeatStore,
  recordHeartbeat,
  getMissedHeartbeats,
  isHeartbeatHealthy,
  pruneHeartbeatRecords,
  getLatestHeartbeat,
} from './heartbeat';

describe('createHeartbeatStore', () => {
  it('initializes with expected defaults', () => {
    const store = createHeartbeatStore(5000);
    expect(store.expectedIntervalMs).toBe(5000);
    expect(store.maxMissed).toBe(3);
    expect(store.lastSeen).toBeNull();
    expect(store.records).toHaveLength(0);
  });

  it('accepts custom maxMissed', () => {
    const store = createHeartbeatStore(1000, 5);
    expect(store.maxMissed).toBe(5);
  });
});

describe('recordHeartbeat', () => {
  it('records first heartbeat with expected interval', () => {
    const store = createHeartbeatStore(5000);
    const now = Date.now();
    const record = recordHeartbeat(store, now);
    expect(record.intervalMs).toBe(5000);
    expect(record.timestamp).toBe(now);
    expect(store.lastSeen).toBe(now);
  });

  it('marks healthy when drift is within 50%', () => {
    const store = createHeartbeatStore(1000);
    const t0 = 1000000;
    recordHeartbeat(store, t0);
    const record = recordHeartbeat(store, t0 + 1100);
    expect(record.healthy).toBe(true);
  });

  it('marks unhealthy when drift exceeds 50%', () => {
    const store = createHeartbeatStore(1000);
    const t0 = 1000000;
    recordHeartbeat(store, t0);
    const record = recordHeartbeat(store, t0 + 2000);
    expect(record.healthy).toBe(false);
  });

  it('appends records', () => {
    const store = createHeartbeatStore(500);
    recordHeartbeat(store, 1000);
    recordHeartbeat(store, 1500);
    expect(store.records).toHaveLength(2);
  });
});

describe('getMissedHeartbeats', () => {
  it('returns 0 when no heartbeat recorded', () => {
    const store = createHeartbeatStore(1000);
    expect(getMissedHeartbeats(store, Date.now())).toBe(0);
  });

  it('calculates missed beats correctly', () => {
    const store = createHeartbeatStore(1000);
    recordHeartbeat(store, 0);
    expect(getMissedHeartbeats(store, 3500)).toBe(2);
  });
});

describe('isHeartbeatHealthy', () => {
  it('returns true when missed < maxMissed', () => {
    const store = createHeartbeatStore(1000, 3);
    recordHeartbeat(store, 0);
    expect(isHeartbeatHealthy(store, 1500)).toBe(true);
  });

  it('returns false when missed >= maxMissed', () => {
    const store = createHeartbeatStore(1000, 3);
    recordHeartbeat(store, 0);
    expect(isHeartbeatHealthy(store, 4500)).toBe(false);
  });
});

describe('pruneHeartbeatRecords', () => {
  it('removes old records', () => {
    const store = createHeartbeatStore(1000);
    recordHeartbeat(store, 1000);
    recordHeartbeat(store, 2000);
    recordHeartbeat(store, 10000);
    pruneHeartbeatRecords(store, 5000, 10000);
    expect(store.records).toHaveLength(1);
    expect(store.records[0].timestamp).toBe(10000);
  });
});

describe('getLatestHeartbeat', () => {
  it('returns null when no records', () => {
    const store = createHeartbeatStore(1000);
    expect(getLatestHeartbeat(store)).toBeNull();
  });

  it('returns the most recent record', () => {
    const store = createHeartbeatStore(1000);
    recordHeartbeat(store, 1000);
    recordHeartbeat(store, 2000);
    const latest = getLatestHeartbeat(store);
    expect(latest?.timestamp).toBe(2000);
  });
});
