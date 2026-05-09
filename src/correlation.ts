import { CorrelationEvent, CorrelationGroup, CorrelationStore } from './correlation.types';

export function createCorrelationStore(windowMs = 60_000): CorrelationStore {
  return { groups: {}, windowMs };
}

export function correlationKey(event: CorrelationEvent): string {
  return `${event.process}:${event.protocol}`;
}

export function addCorrelationEvent(
  store: CorrelationStore,
  event: CorrelationEvent
): CorrelationGroup {
  const key = correlationKey(event);
  const now = event.timestamp;

  if (!store.groups[key]) {
    store.groups[key] = {
      key,
      events: [],
      firstSeen: now,
      lastSeen: now,
      count: 0,
    };
  }

  const group = store.groups[key];
  group.events.push(event);
  group.lastSeen = now;
  group.count += 1;

  return group;
}

export function purgeCorrelationWindow(store: CorrelationStore, now = Date.now()): void {
  const cutoff = now - store.windowMs;
  for (const key of Object.keys(store.groups)) {
    const group = store.groups[key];
    group.events = group.events.filter((e) => e.timestamp >= cutoff);
    if (group.events.length === 0) {
      delete store.groups[key];
    } else {
      group.count = group.events.length;
      group.firstSeen = group.events[0].timestamp;
      group.lastSeen = group.events[group.events.length - 1].timestamp;
    }
  }
}

export function getCorrelatedGroups(
  store: CorrelationStore,
  minCount: number
): CorrelationGroup[] {
  return Object.values(store.groups).filter((g) => g.count >= minCount);
}

export function resetCorrelationStore(store: CorrelationStore): void {
  store.groups = {};
}
