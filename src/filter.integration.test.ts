import { applyFilters } from './filter';
import { scanPorts } from './scanner';

jest.mock('./scanner');

const mockedScanPorts = scanPorts as jest.MockedFunction<typeof scanPorts>;

describe('filter integration with scanner output', () => {
  beforeEach(() => {
    mockedScanPorts.mockResolvedValue([
      { port: 22, protocol: 'tcp', process: 'sshd', pid: 1001 },
      { port: 80, protocol: 'tcp', process: 'apache2', pid: 1002 },
      { port: 3306, protocol: 'tcp', process: 'mysqld', pid: 1003 },
      { port: 5432, protocol: 'tcp', process: 'postgres', pid: 1004 },
      { port: 53, protocol: 'udp', process: 'dnsmasq', pid: 1005 },
      { port: 6379, protocol: 'tcp', process: 'redis-server', pid: 1006 },
    ]);
  });

  it('filters scanner output to known safe ports', async () => {
    const ports = await scanPorts();
    const result = applyFilters(ports, {
      includePorts: [22, 80, 443],
    });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.port)).toEqual([22, 80]);
  });

  it('excludes database ports from alert candidates', async () => {
    const ports = await scanPorts();
    const result = applyFilters(ports, {
      excludePorts: [3306, 5432, 6379],
      protocols: ['tcp'],
    });
    expect(result.map((p) => p.port)).not.toContain(3306);
    expect(result.map((p) => p.port)).not.toContain(5432);
    expect(result.map((p) => p.port)).not.toContain(6379);
  });

  it('isolates high ports for review', async () => {
    const ports = await scanPorts();
    const result = applyFilters(ports, {
      portRange: { min: 1024, max: 65535 },
    });
    expect(result.every((p) => p.port >= 1024)).toBe(true);
  });

  it('returns empty array when all ports excluded', async () => {
    const ports = await scanPorts();
    const result = applyFilters(ports, {
      excludeProcesses: ['sshd', 'apache2', 'mysqld', 'postgres', 'dnsmasq', 'redis-server'],
    });
    expect(result).toHaveLength(0);
  });
});
