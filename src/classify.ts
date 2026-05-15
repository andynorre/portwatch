import { PortInfo } from './baseline.types';

export type PortCategory =
  | 'well-known'
  | 'registered'
  | 'dynamic'
  | 'privileged'
  | 'unknown';

export interface ClassifiedPort {
  port: number;
  protocol: string;
  category: PortCategory;
  label: string;
}

const WELL_KNOWN_LABELS: Record<number, string> = {
  22: 'SSH',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  3306: 'MySQL',
  5432: 'PostgreSQL',
  6379: 'Redis',
  27017: 'MongoDB',
};

export function categorizePort(port: number): PortCategory {
  if (port < 0 || port > 65535) return 'unknown';
  if (port < 1024) return 'privileged';
  if (port <= 1023) return 'well-known';
  if (port <= 49151) return 'registered';
  return 'dynamic';
}

export function labelPort(port: number): string {
  return WELL_KNOWN_LABELS[port] ?? `port-${port}`;
}

export function classifyPort(info: PortInfo): ClassifiedPort {
  const category = categorizePort(info.port);
  const label = labelPort(info.port);
  return {
    port: info.port,
    protocol: info.protocol,
    category,
    label,
  };
}

export function classifyPorts(ports: PortInfo[]): ClassifiedPort[] {
  return ports.map(classifyPort);
}

export function groupByCategory(
  classified: ClassifiedPort[]
): Record<PortCategory, ClassifiedPort[]> {
  const groups: Record<PortCategory, ClassifiedPort[]> = {
    'well-known': [],
    registered: [],
    dynamic: [],
    privileged: [],
    unknown: [],
  };
  for (const entry of classified) {
    groups[entry.category].push(entry);
  }
  return groups;
}
