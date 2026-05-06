export interface DaemonOptions {
  configPath: string;
}

export interface DaemonState {
  running: boolean;
  intervalHandle: ReturnType<typeof setInterval> | null;
  tickCount: number;
}

export interface DaemonConfig {
  intervalMs: number;
  baselinePath: string;
  desktopNotifications: boolean;
  ignoredPorts: number[];
}
