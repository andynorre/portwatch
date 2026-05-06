import * as fs from 'fs';
import * as path from 'path';
import type { NotifyChannel } from './notifier';

export interface PortwatchConfig {
  intervalSeconds: number;
  baselinePath: string;
  notify: {
    channels: NotifyChannel[];
    webhookUrl?: string;
  };
  ignorePorts?: number[];
}

const DEFAULTS: PortwatchConfig = {
  intervalSeconds: 30,
  baselinePath: path.join(process.cwd(), '.portwatch-baseline.json'),
  notify: {
    channels: ['console'],
  },
  ignorePorts: [],
};

export function loadConfig(configPath?: string): PortwatchConfig {
  const resolved = configPath
    ? path.resolve(configPath)
    : path.join(process.cwd(), 'portwatch.config.json');

  if (!fs.existsSync(resolved)) {
    return { ...DEFAULTS };
  }

  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PortwatchConfig>;
    return {
      ...DEFAULTS,
      ...parsed,
      notify: {
        ...DEFAULTS.notify,
        ...(parsed.notify ?? {}),
      },
    };
  } catch (err) {
    throw new Error(`Failed to parse config at ${resolved}: ${(err as Error).message}`);
  }
}

export function validateConfig(config: PortwatchConfig): string[] {
  const errors: string[] = [];
  if (config.intervalSeconds < 5) {
    errors.push('intervalSeconds must be at least 5');
  }
  if (!config.baselinePath) {
    errors.push('baselinePath is required');
  }
  if (!config.notify.channels.length) {
    errors.push('at least one notify channel is required');
  }
  const validChannels: NotifyChannel[] = ['console', 'desktop', 'webhook'];
  for (const ch of config.notify.channels) {
    if (!validChannels.includes(ch)) {
      errors.push(`unknown notify channel: ${ch}`);
    }
  }
  if (config.notify.channels.includes('webhook') && !config.notify.webhookUrl) {
    errors.push('webhookUrl is required when webhook channel is enabled');
  }
  return errors;
}
