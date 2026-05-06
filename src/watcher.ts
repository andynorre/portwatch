import { scanPorts } from './scanner';
import { loadBaseline, saveBaseline, diffPorts } from './baseline';
import { buildAlerts } from './alerter';
import { notifyConsole, notifyDesktop } from './notifier';
import { loadConfig } from './config';
import type { WatcherState, WatcherOptions } from './watcher.types';

let watcherTimer: ReturnType<typeof setInterval> | null = null;
let watcherState: WatcherState = { running: false, tickCount: 0, lastScan: null };

export async function startWatcher(options: WatcherOptions = {}): Promise<void> {
  if (watcherState.running) {
    throw new Error('Watcher is already running');
  }

  const config = await loadConfig(options.configPath);
  const intervalMs = (options.intervalSeconds ?? config.intervalSeconds ?? 30) * 1000;

  watcherState = { running: true, tickCount: 0, lastScan: null };

  const tick = async () => {
    try {
      const current = await scanPorts();
      const baseline = await loadBaseline(config.baselinePath);

      if (!baseline) {
        await saveBaseline(current, config.baselinePath);
        notifyConsole({ type: 'info', message: 'Baseline created', ports: current });
        watcherState.lastScan = new Date();
        watcherState.tickCount++;
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

      watcherState.lastScan = new Date();
      watcherState.tickCount++;
    } catch (err) {
      notifyConsole({ type: 'error', message: `Watcher tick failed: ${(err as Error).message}`, ports: [] });
    }
  };

  await tick();
  watcherTimer = setInterval(tick, intervalMs);
}

export function stopWatcher(): void {
  if (watcherTimer !== null) {
    clearInterval(watcherTimer);
    watcherTimer = null;
  }
  watcherState = { running: false, tickCount: watcherState.tickCount, lastScan: watcherState.lastScan };
}

export function getWatcherState(): WatcherState {
  return { ...watcherState };
}
