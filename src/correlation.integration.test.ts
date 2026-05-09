import {
  createCorrelationStore,
  addCorrelationEvent,
  purgeCorrelationWindow,
  getCorrelatedGroups,
} from './correlation';
import { CorrelationEvent } from './correlation.types';

function makeEvent(id: string, process: string, timestamp: number): CorrelationEvent {
  return { id, port: 443, protocol: 'tcp', process, timestamp, severity: 'high' };
}

describe('correlation integration', () => {
  it('tracks a burst of events from the same process and surfaces them', () => {
    const store = createCorrelationStore(30_000);
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      addCorrelationEvent(store, makeEvent(`evt-${i}`, 'malware', now - i * 1_000));
    }
    addCorrelationEvent(store, makeEvent('evt-lone', 'nginx', now));

    const groups = getCorrelatedGroups(store, 3);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('malware:tcp');
    expect(groups[0].count).toBe(5);
  });

  it('purges stale events and re-evaluates groups', () => {
    const store = createCorrelationStore(10_000);
    const now = Date.now();

    addCorrelationEvent(store, makeEvent('old-1', 'node', now - 15_000));
    addCorrelationEvent(store, makeEvent('old-2', 'node', now - 12_000));
    addCorrelationEvent(store, makeEvent('new-1', 'node', now - 1_000));

    purgeCorrelationWindow(store, now);

    const groups = getCorrelatedGroups(store, 2);
    expect(groups).toHaveLength(0);

    const single = getCorrelatedGroups(store, 1);
    expect(single).toHaveLength(1);
    expect(single[0].count).toBe(1);
  });
});
