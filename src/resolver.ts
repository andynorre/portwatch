import { execSync } from 'child_process';

export interface ProcessInfo {
  pid: number;
  name: string;
  user: string;
}

export interface ResolvedPort {
  port: number;
  protocol: string;
  process: ProcessInfo | null;
}

function resolveLinux(port: number, protocol: string): ProcessInfo | null {
  try {
    const output = execSync(
      `ss -tlnp sport = :${port} 2>/dev/null || netstat -tlnp 2>/dev/null | grep :${port}`,
      { encoding: 'utf8', timeout: 3000 }
    );
    const match = output.match(/pid=(\d+),comm=([^,)]+)/);
    if (match) {
      const pid = parseInt(match[1], 10);
      const name = match[2].trim();
      const user = resolveUser(pid);
      return { pid, name, user };
    }
  } catch {
    // process lookup failed gracefully
  }
  return null;
}

function resolveMac(port: number, protocol: string): ProcessInfo | null {
  try {
    const flag = protocol === 'udp' ? 'u' : 't';
    const output = execSync(
      `lsof -i ${flag}:${port} -n -P 2>/dev/null`,
      { encoding: 'utf8', timeout: 3000 }
    );
    const lines = output.trim().split('\n').slice(1);
    if (lines.length > 0) {
      const parts = lines[0].split(/\s+/);
      const name = parts[0] ?? 'unknown';
      const pid = parseInt(parts[1] ?? '0', 10);
      const user = parts[2] ?? 'unknown';
      return { pid, name, user };
    }
  } catch {
    // process lookup failed gracefully
  }
  return null;
}

function resolveUser(pid: number): string {
  try {
    return execSync(`ps -o user= -p ${pid} 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 1000,
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function resolvePort(port: number, protocol: string): ResolvedPort {
  const platform = process.platform;
  let info: ProcessInfo | null = null;

  if (platform === 'linux') {
    info = resolveLinux(port, protocol);
  } else if (platform === 'darwin') {
    info = resolveMac(port, protocol);
  }

  return { port, protocol, process: info };
}

export function resolvePorts(entries: Array<{ port: number; protocol: string }>): ResolvedPort[] {
  return entries.map(({ port, protocol }) => resolvePort(port, protocol));
}
