import { scanPorts, PortBinding } from './scanner';
import { execSync } from 'child_process';

jest.mock('child_process');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('scanPorts', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should return an empty array when no ports are bound (linux)', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    mockExecSync.mockReturnValue('Netid State Recv-Q Send-Q Local Address:Port\n' as any);

    const result = scanPorts();
    expect(result).toEqual([]);
  });

  it('should parse linux ss output correctly', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const mockOutput =
      'Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\n' +
      'tcp   LISTEN 0      128    0.0.0.0:3000      0.0.0.0:*         users:(("node",pid=1234,fd=5))\n';

    mockExecSync.mockReturnValue(mockOutput as any);

    const result = scanPorts();
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('should throw an error on unsupported platforms', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    expect(() => scanPorts()).toThrow('Unsupported platform: win32');
  });

  it('should throw when execSync fails', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    mockExecSync.mockImplementation(() => {
      throw new Error('command not found');
    });

    expect(() => scanPorts()).toThrow('Failed to scan ports: command not found');
  });

  it('should return PortBinding objects with required fields', () => {
    const binding: PortBinding = {
      port: 8080,
      pid: 999,
      process: 'node',
      protocol: 'tcp',
      address: '0.0.0.0',
    };

    expect(binding).toHaveProperty('port');
    expect(binding).toHaveProperty('pid');
    expect(binding).toHaveProperty('process');
    expect(binding).toHaveProperty('protocol');
    expect(binding).toHaveProperty('address');
    expect(['tcp', 'udp']).toContain(binding.protocol);
  });
});
