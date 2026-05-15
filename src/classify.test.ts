import {
  categorizePort,
  labelPort,
  classifyPort,
  classifyPorts,
  groupByCategory,
  ClassifiedPort,
} from './classify';
import { PortInfo } from './baseline.types';

function makePort(port: number, protocol = 'tcp'): PortInfo {
  return { port, protocol, pid: 1234, process: 'test' };
}

describe('categorizePort', () => {
  it('returns privileged for ports below 1024', () => {
    expect(categorizePort(80)).toBe('privileged');
    expect(categorizePort(22)).toBe('privileged');
    expect(categorizePort(0)).toBe('privileged');
  });

  it('returns registered for ports 1024–49151', () => {
    expect(categorizePort(3306)).toBe('registered');
    expect(categorizePort(8080)).toBe('registered');
    expect(categorizePort(49151)).toBe('registered');
  });

  it('returns dynamic for ports 49152–65535', () => {
    expect(categorizePort(49152)).toBe('dynamic');
    expect(categorizePort(65535)).toBe('dynamic');
  });

  it('returns unknown for out-of-range values', () => {
    expect(categorizePort(-1)).toBe('unknown');
    expect(categorizePort(65536)).toBe('unknown');
  });
});

describe('labelPort', () => {
  it('returns known label for well-known ports', () => {
    expect(labelPort(80)).toBe('HTTP');
    expect(labelPort(443)).toBe('HTTPS');
    expect(labelPort(22)).toBe('SSH');
  });

  it('returns generic label for unknown ports', () => {
    expect(labelPort(9999)).toBe('port-9999');
  });
});

describe('classifyPort', () => {
  it('classifies a well-known port correctly', () => {
    const result = classifyPort(makePort(80));
    expect(result.category).toBe('privileged');
    expect(result.label).toBe('HTTP');
    expect(result.protocol).toBe('tcp');
  });

  it('classifies a dynamic port correctly', () => {
    const result = classifyPort(makePort(60000));
    expect(result.category).toBe('dynamic');
    expect(result.label).toBe('port-60000');
  });
});

describe('classifyPorts', () => {
  it('returns a classification for each port', () => {
    const ports = [makePort(22), makePort(3306), makePort(55000)];
    const result = classifyPorts(ports);
    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('SSH');
    expect(result[1].label).toBe('MySQL');
    expect(result[2].category).toBe('dynamic');
  });
});

describe('groupByCategory', () => {
  it('groups classified ports by category', () => {
    const classified: ClassifiedPort[] = [
      { port: 80, protocol: 'tcp', category: 'privileged', label: 'HTTP' },
      { port: 8080, protocol: 'tcp', category: 'registered', label: 'port-8080' },
      { port: 55000, protocol: 'tcp', category: 'dynamic', label: 'port-55000' },
    ];
    const groups = groupByCategory(classified);
    expect(groups.privileged).toHaveLength(1);
    expect(groups.registered).toHaveLength(1);
    expect(groups.dynamic).toHaveLength(1);
    expect(groups['well-known']).toHaveLength(0);
  });
});
