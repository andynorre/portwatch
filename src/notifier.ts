import { execSync } from 'child_process';
import * as os from 'os';

export type NotifyChannel = 'console' | 'desktop' | 'webhook';

export interface NotifierConfig {
  channels: NotifyChannel[];
  webhookUrl?: string;
}

export function notifyConsole(message: string): void {
  const timestamp = new Date().toISOString();
  console.warn(`[portwatch ${timestamp}] ${message}`);
}

export function notifyDesktop(title: string, message: string): void {
  const platform = os.platform();
  try {
    if (platform === 'darwin') {
      execSync(
        `osascript -e 'display notification "${message}" with title "${title}"'`,
        { stdio: 'ignore' }
      );
    } else if (platform === 'linux') {
      execSync(`notify-send "${title}" "${message}"`, { stdio: 'ignore' });
    }
  } catch {
    // Desktop notifications are best-effort
  }
}

export async function notifyWebhook(
  url: string,
  title: string,
  message: string
): Promise<void> {
  const body = JSON.stringify({ title, message, timestamp: new Date().toISOString() });
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!response.ok) {
    throw new Error(`Webhook request failed with status ${response.status}`);
  }
}

export async function dispatch(
  config: NotifierConfig,
  title: string,
  message: string
): Promise<void> {
  for (const channel of config.channels) {
    if (channel === 'console') {
      notifyConsole(`${title}: ${message}`);
    } else if (channel === 'desktop') {
      notifyDesktop(title, message);
    } else if (channel === 'webhook') {
      if (config.webhookUrl) {
        await notifyWebhook(config.webhookUrl, title, message);
      }
    }
  }
}
