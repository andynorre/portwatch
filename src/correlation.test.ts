import {
  createCorrelationStore,
  addCorrelationEvent,
  purgeCorrelationWindow,
  getCorrelatedGroups,
  resetCorrelationStore,
  correlationKey,
} from './correlation';
import { CorrelationEvent } from './correlation.types';

function makeEvent(overrides: Partial<CorrelationEvent> = {}): CorrelationEvent {
  return {
    id: 'evt-1',
    port: 8080,
    protocol: 'tcp',
    process: 'node',
    timestamp: Date.now(),
    severity: 'medium',
    ...overrides,
  };
}

describe('correlationKey', () => {
  it('combines process and protocol', () => {
    const key = correlationKey(makeEvent({ process: 'nginx', protocol: 'tcp' }));
    expect(key).toBe('nginx:tcp');
  });
});

describe('addCorrelationEvent', () => {
  it('creates a new group on first event', () => {
    const store = createCorrelationStore();
    const group = addCorrelationEvent(store, makeEvent());
    expect(group.count).toBe(1);
    expect(group.events).toHaveLength(1);
  });

  it('accumulates events under the same key', () => {
    const store = createCorrelationStore();
    addCorrelationEvent(store, makeEvent({ id: 'a' }));
    const group = addCorrelationEvent(store, makeEvent({ id: 'b' }));
    expect(group.count).toBe(2);
  });

  it('separates events with different process names', () => {
    const store = createCorrelationStore();
    addCorrelationEvent(store, makeEvent({ process: 'node' }));
    addCorrelationEvent(store, makeEvent({ process: 'python' }));
    expect(Object.keys(store.groups)).toHaveLength(2);
  });
});

describe('purgeCorrelationWindow', () => {
  it('removes events outside the time window', () => {
    const store = createCorrelationStore(5_000);
    const old = makeEvent({ timestamp: Date.now() - 10_000 });
    addCorrelationEvent(store, old);
    purgeCorrelationWindow(store, Date.now());
    expect(Object.keys(store.groups)).toHaveLength(0);
  });

  it('retains events within the window', () => {
    const store = createCorrelationStore(60_000);
    addCorrelationEvent(store, makeEvent());
    purgeCorrelationWindow(store, Date.now());
    expect(Object.keys(store.groups)).toHaveLength(1);
  });
});

describe('getCorrelatedGroups', () => {
  it('returns groups meeting the minCount threshold', () => {
    const store = createCorrelationStore();
    addCorrelationEvent(store, makeEvent({ id: 'a' }));
    addCorrelationEvent(store, makeEvent({ id: 'b' }));
    addCorrelationEvent(store, makeEvent({ id: 'c', process: 'other' }));
    const groups = getCorrelatedGroups(store, 2);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
  });
});

describe('resetCorrelationStore', () => {
  it('clears all groups', () => {
    const store = createCorrelationStore();
    addCorrelationEvent(store, makeEvent());
    resetCorrelationStore(store);
    expect(Object.keys(store.groups)).toHaveLength(0);
  });
});
