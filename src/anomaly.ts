import type { PortEntry } from './scanner';
import type { Anomaly, AnomalyKind, AnomalyStore } from './anomaly.types';

export function createAnomalyStore(): AnomalyStore {
  return { anomalies: [], lastEvaluatedAt: null };
}

function entryKey(e: PortEntry): string {
  return `${e.protocol}:${e.port}`;
}

export function detectAnomalies(
  baseline: PortEntry[],
  current: PortEntry[],
  now: number = Date.now()
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const baselineMap = new Map<string, PortEntry>();
  const currentMap = new Map<string, PortEntry>();

  for (const e of baseline) baselineMap.set(entryKey(e), e);
  for (const e of current) currentMap.set(entryKey(e), e);

  for (const [key, curr] of currentMap) {
    const base = baselineMap.get(key);
    if (!base) {
      anomalies.push(makeAnomaly('new_port', curr, undefined, undefined, now));
      continue;
    }
    if (base.process !== curr.process) {
      anomalies.push(makeAnomaly('process_changed', curr, base.process, curr.process, now));
    }
    if (base.user !== curr.user) {
      anomalies.push(makeAnomaly('user_changed', curr, base.user, curr.user, now));
    }
  }

  for (const [key, base] of baselineMap) {
    if (!currentMap.has(key)) {
      anomalies.push(makeAnomaly('port_closed', base, undefined, undefined, now));
    }
  }

  return anomalies;
}

function makeAnomaly(
  kind: AnomalyKind,
  entry: PortEntry,
  previous: string | undefined,
  current: string | undefined,
  detectedAt: number
): Anomaly {
  return { kind, port: entry.port, protocol: entry.protocol, previous, current, detectedAt };
}

export function recordAnomalies(store: AnomalyStore, anomalies: Anomaly[], now: number = Date.now()): AnomalyStore {
  return {
    anomalies: [...store.anomalies, ...anomalies],
    lastEvaluatedAt: now,
  };
}

export function getAnomaliesByKind(store: AnomalyStore, kind: AnomalyKind): Anomaly[] {
  return store.anomalies.filter((a) => a.kind === kind);
}

export function purgeAnomalies(store: AnomalyStore, olderThanMs: number, now: number = Date.now()): AnomalyStore {
  const cutoff = now - olderThanMs;
  return {
    ...store,
    anomalies: store.anomalies.filter((a) => a.detectedAt >= cutoff),
  };
}
