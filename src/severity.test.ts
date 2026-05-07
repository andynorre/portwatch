import { classifyPort, severityRank, highestSeverity, SeverityRule } from './severity';

describe('classifyPort', () => {
  it('classifies privileged ports as critical', () => {
    expect(classifyPort(80, 'tcp')).toBe('critical');
    expect(classifyPort(443, 'tcp')).toBe('critical');
    expect(classifyPort(1, 'tcp')).toBe('critical');
    expect(classifyPort(1023, 'tcp')).toBe('critical');
  });

  it('classifies registered ports as warning', () => {
    expect(classifyPort(8080, 'tcp')).toBe('warning');
    expect(classifyPort(3000, 'tcp')).toBe('warning');
    expect(classifyPort(49151, 'tcp')).toBe('warning');
  });

  it('classifies ephemeral ports as info', () => {
    expect(classifyPort(55000, 'tcp')).toBe('info');
    expect(classifyPort(65535, 'udp')).toBe('info');
  });

  it('applies custom rules before defaults', () => {
    const customRules: SeverityRule[] = [
      { portRange: [3000, 3000], protocols: ['tcp'], level: 'critical' },
    ];
    expect(classifyPort(3000, 'tcp', undefined, customRules)).toBe('critical');
  });

  it('skips custom rule if protocol does not match', () => {
    const customRules: SeverityRule[] = [
      { portRange: [3000, 3000], protocols: ['tcp'], level: 'critical' },
    ];
    expect(classifyPort(3000, 'udp', undefined, customRules)).toBe('warning');
  });

  it('applies process pattern rules', () => {
    const customRules: SeverityRule[] = [
      { processPatterns: [/^malware/i], level: 'critical' },
    ];
    expect(classifyPort(50000, 'tcp', 'malware-agent', customRules)).toBe('critical');
    expect(classifyPort(50000, 'tcp', 'node', customRules)).toBe('info');
  });
});

describe('severityRank', () => {
  it('returns correct numeric ranks', () => {
    expect(severityRank('info')).toBe(1);
    expect(severityRank('warning')).toBe(2);
    expect(severityRank('critical')).toBe(3);
  });
});

describe('highestSeverity', () => {
  it('returns info for empty array', () => {
    expect(highestSeverity([])).toBe('info');
  });

  it('returns the highest level among mixed values', () => {
    expect(highestSeverity(['info', 'warning', 'critical'])).toBe('critical');
    expect(highestSeverity(['info', 'warning'])).toBe('warning');
    expect(highestSeverity(['info', 'info'])).toBe('info');
  });
});
