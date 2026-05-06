import { PortEntry } from './scanner';

export interface FilterOptions {
  protocols?: ('tcp' | 'udp')[];
  portRange?: { min: number; max: number };
  excludePorts?: number[];
  includePorts?: number[];
  excludeProcesses?: string[];
}

export function filterByProtocol(
  ports: PortEntry[],
  protocols: ('tcp' | 'udp')[]
): PortEntry[] {
  return ports.filter((p) => protocols.includes(p.protocol as 'tcp' | 'udp'));
}

export function filterByPortRange(
  ports: PortEntry[],
  min: number,
  max: number
): PortEntry[] {
  return ports.filter((p) => p.port >= min && p.port <= max);
}

export function filterByExclusion(
  ports: PortEntry[],
  excludePorts: number[]
): PortEntry[] {
  return ports.filter((p) => !excludePorts.includes(p.port));
}

export function filterByInclusion(
  ports: PortEntry[],
  includePorts: number[]
): PortEntry[] {
  return ports.filter((p) => includePorts.includes(p.port));
}

export function filterByExcludedProcesses(
  ports: PortEntry[],
  excludeProcesses: string[]
): PortEntry[] {
  return ports.filter(
    (p) => !p.process || !excludeProcesses.includes(p.process)
  );
}

export function applyFilters(
  ports: PortEntry[],
  options: FilterOptions
): PortEntry[] {
  let result = [...ports];

  if (options.protocols && options.protocols.length > 0) {
    result = filterByProtocol(result, options.protocols);
  }
  if (options.portRange) {
    result = filterByPortRange(
      result,
      options.portRange.min,
      options.portRange.max
    );
  }
  if (options.excludePorts && options.excludePorts.length > 0) {
    result = filterByExclusion(result, options.excludePorts);
  }
  if (options.includePorts && options.includePorts.length > 0) {
    result = filterByInclusion(result, options.includePorts);
  }
  if (options.excludeProcesses && options.excludeProcesses.length > 0) {
    result = filterByExcludedProcesses(result, options.excludeProcesses);
  }

  return result;
}
