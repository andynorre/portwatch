import { scanPorts } from './scanner';
import { loadBaseline, saveBaseline, diffPorts } from './baseline';
import { buildAlerts } from './alerter';
import { notifyConsole, notifyDesktop } from './notifier';
import { loadConfig, validateConfig } from './config';
import type { DaemonOptions, DaemonState } from './daemon.types';

let state: DaemonState = {
  running: false,
  intervalHandle: null,
  tickCount: 0,
};

export async function startDaemon(options: Partial<DaemonOptions> = {}): Promise<void> {
  const rawConfig = loadConfig(options.configPath);
  const config = validateConfig(rawConfig);

  if (state.running) {
    console.warn('[portwatch] Daemon is already running.');
    return;
  }

  state.running = true;
  state.tickCount = 0;

  console.log(`[portwatch] Starting daemon (interval: ${config.intervalMs}ms)`);

  const tick = async () => {
    try {
      const current = await scanPorts();
      const baseline = loadBaseline(config.baselinePath);

      if (!baseline) {
        console.log('[portwatch] No baseline found — saving current snapshot.');
        saveBaseline(current, config.baselinePath);
        return;
      }

      const diff = diffPorts(baseline, current);
      const alerts = buildAlerts(diff, config);

      for (const alert of alerts) {
        notifyConsole(alert);
        if (config.desktopNotifications) {
          await notifyDesktop(alert);
        }
      }

      state.tickCount++;
    } catch (err) {
      console.error('[portwatch] Error during scan tick:', err);
    }
  };

  await tick();
  state.intervalHandle = setInterval(tick, config.intervalMs);
}

export function stopDaemon(): void {
  if (!state.running) {
    console.warn('[portwatch] Daemon is not running.');
    return;
  }

  if (state.intervalHandle !== null) {
    clearInterval(state.intervalHandle);
    state.intervalHandle = null;
  }

  state.running = false;
  console.log(`[portwatch] Daemon stopped after ${state.tickCount} tick(s).`);
}

export function getDaemonState(): Readonly<DaemonState> {
  return { ...state };
}
