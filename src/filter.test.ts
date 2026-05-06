import {
  filterByProtocol,
  filterByPortRange,
  filterByExclusion,
  filterByInclusion,
  filterByExcludedProcesses,
  applyFilters,
} from './filter';
import { PortEntry } from './scanner';

const mockPorts: PortEntry[] = [
  { port: 22, protocol: 'tcp', process: 'sshd', pid: 100 },
  { port: 80, protocol: 'tcp', process: 'nginx', pid: 200 },
  { port: 443, protocol: 'tcp', process: 'nginx', pid: 200 },
  { port: 53, protocol: 'udp', process: 'systemd-resolved', pid: 300 },
  { port: 8080, protocol: 'tcp', process: 'node', pid: 400 },
  { port: 9000, protocol: 'udp', process: 'custom', pid: 500 },
];

describe('filterByProtocol', () => {
  it('filters to tcp only', () => {
    const result = filterByProtocol(mockPorts, ['tcp']);
    expect(result.every((p) => p.protocol === 'tcp')).toBe(true);
    expect(result).toHaveLength(4);
  });

  it('filters to udp only', () => {
    const result = filterByProtocol(mockPorts, ['udp']);
    expect(result.every((p) => p.protocol === 'udp')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('returns all when both protocols specified', () => {
    const result = filterByProtocol(mockPorts, ['tcp', 'udp']);
    expect(result).toHaveLength(6);
  });
});

describe('filterByPortRange', () => {
  it('returns ports within range', () => {
    const result = filterByPortRange(mockPorts, 80, 443);
    expect(result.map((p) => p.port)).toEqual([80, 443]);
  });

  it('returns empty when no ports in range', () => {
    const result = filterByPortRange(mockPorts, 10000, 20000);
    expect(result).toHaveLength(0);
  });
});

describe('filterByExclusion', () => {
  it('removes excluded ports', () => {
    const result = filterByExclusion(mockPorts, [22, 80]);
    expect(result.map((p) => p.port)).not.toContain(22);
    expect(result.map((p) => p.port)).not.toContain(80);
    expect(result).toHaveLength(4);
  });
});

describe('filterByInclusion', () => {
  it('returns only included ports', () => {
    const result = filterByInclusion(mockPorts, [22, 443]);
    expect(result.map((p) => p.port)).toEqual([22, 443]);
  });
});

describe('filterByExcludedProcesses', () => {
  it('removes entries matching excluded processes', () => {
    const result = filterByExcludedProcesses(mockPorts, ['nginx']);
    expect(result.find((p) => p.process === 'nginx')).toBeUndefined();
    expect(result).toHaveLength(4);
  });
});

describe('applyFilters', () => {
  it('applies multiple filters in combination', () => {
    const result = applyFilters(mockPorts, {
      protocols: ['tcp'],
      excludePorts: [22],
      excludeProcesses: ['nginx'],
    });
    expect(result.map((p) => p.port)).toEqual([8080]);
  });

  it('returns all ports when no filters specified', () => {
    const result = applyFilters(mockPorts, {});
    expect(result).toHaveLength(6);
  });
});
