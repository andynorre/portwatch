import { PortInfo } from './baseline.types';

export interface TagRule {
  tag: string;
  portRange?: [number, number];
  protocols?: string[];
  processPatterns?: string[];
}

export interface TagStore {
  rules: TagRule[];
}

export function createTagStore(rules: TagRule[] = []): TagStore {
  return { rules: [...rules] };
}

export function addTagRule(store: TagStore, rule: TagRule): TagStore {
  return { rules: [...store.rules, rule] };
}

export function removeTagRule(store: TagStore, tag: string): TagStore {
  return { rules: store.rules.filter(r => r.tag !== tag) };
}

export function matchesTagRule(port: PortInfo, rule: TagRule): boolean {
  if (rule.portRange) {
    const [min, max] = rule.portRange;
    if (port.port < min || port.port > max) return false;
  }
  if (rule.protocols && rule.protocols.length > 0) {
    if (!rule.protocols.includes(port.protocol)) return false;
  }
  if (rule.processPatterns && rule.processPatterns.length > 0) {
    const proc = port.process ?? '';
    const matched = rule.processPatterns.some(p => proc.includes(p));
    if (!matched) return false;
  }
  return true;
}

export function tagPort(port: PortInfo, store: TagStore): string[] {
  return store.rules
    .filter(rule => matchesTagRule(port, rule))
    .map(rule => rule.tag);
}

export function tagPorts(
  ports: PortInfo[],
  store: TagStore
): Map<PortInfo, string[]> {
  const result = new Map<PortInfo, string[]>();
  for (const port of ports) {
    result.set(port, tagPort(port, store));
  }
  return result;
}

export function getPortsWithTag(
  ports: PortInfo[],
  store: TagStore,
  tag: string
): PortInfo[] {
  return ports.filter(p => tagPort(p, store).includes(tag));
}
