import * as fs from 'fs';
import * as path from 'path';
import { PortInfo } from './scanner';

export interface Baseline {
  createdAt: string;
  ports: PortInfo[];
}

const DEFAULT_BASELINE_PATH = path.join(process.cwd(), '.portwatch-baseline.json');

export function saveBaseline(ports: PortInfo[], filePath: string = DEFAULT_BASELINE_PATH): void {
  const baseline: Baseline = {
    createdAt: new Date().toISOString(),
    ports,
  };
  fs.writeFileSync(filePath, JSON.stringify(baseline, null, 2), 'utf-8');
}

export function loadBaseline(filePath: string = DEFAULT_BASELINE_PATH): Baseline | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Baseline;
  } catch {
    return null;
  }
}

export function diffPorts(
  baseline: PortInfo[],
  current: PortInfo[]
): { added: PortInfo[]; removed: PortInfo[] } {
  const key = (p: PortInfo) => `${p.protocol}:${p.port}:${p.pid ?? ''}`;

  const baselineKeys = new Set(baseline.map(key));
  const currentKeys = new Set(current.map(key));

  const added = current.filter((p) => !baselineKeys.has(key(p)));
  const removed = baseline.filter((p) => !currentKeys.has(key(p)));

  return { added, removed };
}
