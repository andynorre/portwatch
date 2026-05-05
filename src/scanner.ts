import { execSync } from 'child_process';

export interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  pid: number | null;
  process: string | null;
  state: string;
}

export function parseLinuxOutput(raw: string): PortInfo[] {
  const lines = raw.trim().split('\n').slice(1);
  const results: PortInfo[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;
    const proto = parts[0] as 'tcp' | 'udp';
    const localAddr = parts[3];
    const state = parts[5] ?? 'UNKNOWN';
    const pidProcess = parts[6];

    const portMatch = localAddr.match(/:([\d]+)$/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1], 10);

    let pid: number | null = null;
    let process: string | null = null;
    const pidMatch = pidProcess?.match(/(\d+)\/(.+)/);
    if (pidMatch) {
      pid = parseInt(pidMatch[1], 10);
      process = pidMatch[2];
    }

    results.push({ port, protocol: proto, pid, process, state });
  }

  return results;
}

export function parseMacOutput(raw: string): PortInfo[] {
  const lines = raw.trim().split('\n');
  const results: PortInfo[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;
    const proto = parts[0].startsWith('tcp') ? 'tcp' : 'udp';
    const localAddr = parts[3];
    const state = parts[5] ?? 'UNKNOWN';

    const portMatch = localAddr.match(/\.([\d]+)$/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1], 10);

    const pidStr = parts[8];
    const pid = pidStr && /^\d+$/.test(pidStr) ? parseInt(pidStr, 10) : null;
    const process = parts[0] ?? null;

    results.push({ port, protocol: proto, pid, process, state });
  }

  return results;
}

export function scanPorts(): PortInfo[] {
  const platform = process.platform;
  try {
    if (platform === 'linux') {
      const raw = execSync('ss -tulnp', { encoding: 'utf-8' });
      return parseLinuxOutput(raw);
    } else if (platform === 'darwin') {
      const raw = execSync('netstat -anvp tcp', { encoding: 'utf-8' });
      return parseMacOutput(raw);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (err) {
    console.error('Failed to scan ports:', err);
    return [];
  }
}
