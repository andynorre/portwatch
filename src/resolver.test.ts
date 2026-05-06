import { resolvePort, resolvePorts, ResolvedPort } from './resolver';
import { execSync } from 'child_process';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const mockExec = execSync as jest.MockedFunction<typeof execSync>;

const originalPlatform = process.platform;

function setPlatform(platform: string) {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
}

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  mockExec.mockReset();
});

describe('resolvePort', () => {
  it('returns null process info when exec throws on linux', () => {
    setPlatform('linux');
    mockExec.mockImplementation(() => { throw new Error('cmd failed'); });
    const result = resolvePort(8080, 'tcp');
    expect(result).toEqual({ port: 8080, protocol: 'tcp', process: null });
  });

  it('parses process info on linux', () => {
    setPlatform('linux');
    mockExec
      .mockReturnValueOnce('LISTEN 0 128 *:8080 *:* users:(("node",pid=1234,comm=node))' as any)
      .mockReturnValueOnce('myuser\n' as any);
    const result = resolvePort(8080, 'tcp');
    expect(result.port).toBe(8080);
    expect(result.protocol).toBe('tcp');
    expect(result.process?.pid).toBe(1234);
    expect(result.process?.name).toBe('node');
    expect(result.process?.user).toBe('myuser');
  });

  it('parses process info on darwin', () => {
    setPlatform('darwin');
    const lsofOutput = 'COMMAND  PID  USER   FD\nnode     5678 alice  23u';
    mockExec.mockReturnValueOnce(lsofOutput as any);
    const result = resolvePort(3000, 'tcp');
    expect(result.process?.pid).toBe(5678);
    expect(result.process?.name).toBe('node');
    expect(result.process?.user).toBe('alice');
  });

  it('returns null process on darwin when exec throws', () => {
    setPlatform('darwin');
    mockExec.mockImplementation(() => { throw new Error('no lsof'); });
    const result = resolvePort(443, 'tcp');
    expect(result.process).toBeNull();
  });

  it('returns null process on unsupported platform', () => {
    setPlatform('win32');
    const result = resolvePort(80, 'tcp');
    expect(result.process).toBeNull();
  });
});

describe('resolvePorts', () => {
  it('maps over multiple entries', () => {
    setPlatform('win32');
    const entries = [
      { port: 80, protocol: 'tcp' },
      { port: 443, protocol: 'tcp' },
    ];
    const results: ResolvedPort[] = resolvePorts(entries);
    expect(results).toHaveLength(2);
    expect(results[0].port).toBe(80);
    expect(results[1].port).toBe(443);
    results.forEach(r => expect(r.process).toBeNull());
  });
});
