import { WatchdogConfig, WatchdogState, WatchdogStatus } from './watchdog.types';

let _timer: ReturnType<typeof setInterval> | null = null;
let _state: WatchdogState | null = null;
let _config: WatchdogConfig | null = null;

export function createWatchdogState(config: WatchdogConfig): WatchdogState {
  return {
    lastHeartbeat: Date.now(),
    missedBeats: 0,
    status: 'healthy',
    startedAt: Date.now(),
    intervalMs: config.intervalMs,
    maxMissed: config.maxMissed,
  };
}

export function heartbeat(): void {
  if (!_state) return;
  const prev = _state.status;
  _state.lastHeartbeat = Date.now();
  _state.missedBeats = 0;
  _state.status = 'healthy';
  if (prev !== 'healthy' && _config?.onRecovered) {
    _config.onRecovered({ ..._state });
  }
}

export function getWatchdogStatus(): WatchdogStatus {
  return _state?.status ?? 'failed';
}

export function getWatchdogState(): WatchdogState | null {
  return _state ? { ..._state } : null;
}

export function startWatchdog(config: WatchdogConfig): void {
  if (_timer !== null) stopWatchdog();
  _config = config;
  _state = createWatchdogState(config);

  _timer = setInterval(() => {
    if (!_state || !_config) return;
    const elapsed = Date.now() - _state.lastHeartbeat;
    if (elapsed > _config.intervalMs) {
      _state.missedBeats += 1;
      if (_state.missedBeats >= _config.maxMissed) {
        _state.status = 'failed';
        _config.onFailed?.({ ..._state });
      } else {
        _state.status = 'degraded';
        _config.onDegraded?.({ ..._state });
      }
    }
  }, config.intervalMs);
}

export function stopWatchdog(): void {
  if (_timer !== null) {
    clearInterval(_timer);
    _timer = null;
  }
  _state = null;
  _config = null;
}

export function resetWatchdog(): void {
  if (_state && _config) {
    _state = createWatchdogState(_config);
  }
}
