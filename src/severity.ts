export type SeverityLevel = 'info' | 'warning' | 'critical';

export interface SeverityRule {
  portRange?: [number, number];
  protocols?: string[];
  processPatterns?: RegExp[];
  level: SeverityLevel;
}

const DEFAULT_RULES: SeverityRule[] = [
  { portRange: [1, 1023], level: 'critical' },
  { portRange: [1024, 49151], level: 'warning' },
  { portRange: [49152, 65535], level: 'info' },
];

export function classifyPort(
  port: number,
  protocol: string,
  process?: string,
  customRules: SeverityRule[] = []
): SeverityLevel {
  const rules = [...customRules, ...DEFAULT_RULES];

  for (const rule of rules) {
    if (rule.portRange) {
      const [min, max] = rule.portRange;
      if (port < min || port > max) continue;
    }
    if (rule.protocols && !rule.protocols.includes(protocol)) continue;
    if (rule.processPatterns && process) {
      const matched = rule.processPatterns.some((re) => re.test(process));
      if (!matched) continue;
    }
    return rule.level;
  }

  return 'info';
}

export function severityRank(level: SeverityLevel): number {
  switch (level) {
    case 'critical': return 3;
    case 'warning': return 2;
    case 'info': return 1;
  }
}

export function highestSeverity(levels: SeverityLevel[]): SeverityLevel {
  if (levels.length === 0) return 'info';
  return levels.reduce((acc, cur) =>
    severityRank(cur) > severityRank(acc) ? cur : acc
  );
}
