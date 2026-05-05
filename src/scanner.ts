import { execSync } from 'child_process';

export interface PortBinding {
  port: number;
  pid: number;
  process: string;
  protocol: 'tcp' | 'udp';
  address: string;
}

function parseLinuxOutput(output: string): PortBinding[] {
  const bindings: PortBinding[] = [];
  const lines = output.trim().split('\n').slice(1);

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;

    const proto = parts[0] as 'tcp' | 'udp';
    const localAddress = parts[3];
    const pidProcess = parts[6];

    const addrMatch = localAddress.match(/^(.+):(\d+)$/);
    if (!addrMatch) continue;

    const address = addrMatch[1];
    const port = parseInt(addrMatch[2], 10);

    const pidMatch = pidProcess.match(/(\d+)\/(.+)/);
    if (!pidMatch) continue;

    bindings.push({
      port,
      pid: parseInt(pidMatch[1], 10),
      process: pidMatch[2],
      protocol: proto,
      address,
    });
  }

  return bindings;
}

function parseMacOutput(output: string): PortBinding[] {
  const bindings: PortBinding[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const match = line.match(
      /^(tcp|udp)\s+\S+\s+\S+\s+(\S+)\s+\S+\s+LISTEN\s+(\d+)\/(\S+)/i
    );
    if (!match) continue;

    const proto = match[1].toLowerCase() as 'tcp' | 'udp';
    const localAddress = match[2];
    const pid = parseInt(match[3], 10);
    const process = match[4];

    const addrMatch = localAddress.match(/^(.+)\.(\d+)$/);
    if (!addrMatch) continue;

    bindings.push({
      port: parseInt(addrMatch[2], 10),
      pid,
      process,
      protocol: proto,
      address: addrMatch[1],
    });
  }

  return bindings;
}

export function scanPorts(): PortBinding[] {
  const platform = process.platform;

  try {
    if (platform === 'linux') {
      const output = execSync('ss -tlnup 2>/dev/null || netstat -tlnup 2>/dev/null', {
        encoding: 'utf8',
      });
      return parseLinuxOutput(output);
    } else if (platform === 'darwin') {
      const output = execSync('netstat -anvp tcp 2>/dev/null', { encoding: 'utf8' });
      return parseMacOutput(output);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (err) {
    throw new Error(`Failed to scan ports: ${(err as Error).message}`);
  }
}
