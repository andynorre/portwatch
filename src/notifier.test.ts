import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as child_process from 'child_process';
import { notifyConsole, notifyDesktop, notifyWebhook, dispatch } from './notifier';

describe('notifyConsole', () => {
  it('logs a warning with timestamp and message', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    notifyConsole('port 8080 opened');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatch(/\[portwatch .+\] port 8080 opened/);
    spy.mockRestore();
  });
});

describe('notifyDesktop', () => {
  it('calls execSync on supported platforms without throwing', () => {
    const spy = vi.spyOn(child_process, 'execSync').mockImplementation(() => Buffer.from(''));
    expect(() => notifyDesktop('portwatch', 'port 9000 opened')).not.toThrow();
    spy.mockRestore();
  });

  it('swallows errors when desktop notification fails', () => {
    const spy = vi.spyOn(child_process, 'execSync').mockImplementation(() => {
      throw new Error('command not found');
    });
    expect(() => notifyDesktop('portwatch', 'port 9000 opened')).not.toThrow();
    spy.mockRestore();
  });
});

describe('notifyWebhook', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a POST request with JSON body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 });
    await notifyWebhook('https://example.com/hook', 'portwatch', 'port 3000 opened');
    expect(fetch).toHaveBeenCalledWith('https://example.com/hook', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('throws when response is not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    await expect(notifyWebhook('https://example.com/hook', 'portwatch', 'msg'))
      .rejects.toThrow('status 500');
  });
});

describe('dispatch', () => {
  it('calls console notifier when channel is console', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await dispatch({ channels: ['console'] }, 'portwatch', 'test alert');
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('skips webhook when webhookUrl is not configured', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await dispatch({ channels: ['webhook'] }, 'portwatch', 'test alert');
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
