import {
  createBufferStore,
  addToBuffer,
  shouldFlush,
  flushBuffer,
  summarizeBuffer,
} from './buffer';
import { BufferedAlert } from './buffer.types';

function makeAlert(id: string, severity: string, timestamp: number): BufferedAlert {
  return { id, timestamp, port: 443, protocol: 'tcp', process: 'nginx', message: 'alert', severity };
}

describe('buffer integration: fill → flush → summarize cycle', () => {
  it('accumulates alerts and flushes when full', () => {
    let store = createBufferStore(5, 60000);

    for (let i = 0; i < 5; i++) {
      store = addToBuffer(store, makeAlert(`id${i}`, i < 3 ? 'high' : 'low', 1000 + i * 100));
    }

    expect(shouldFlush(store)).toBe(true);

    const { flushed, store: after } = flushBuffer(store, 9000);
    expect(flushed).toHaveLength(5);
    expect(after.entries).toHaveLength(0);
    expect(after.lastFlushedAt).toBe(9000);
  });

  it('summarizes correctly before flush', () => {
    let store = createBufferStore(10, 60000);
    store = addToBuffer(store, makeAlert('x1', 'critical', 2000));
    store = addToBuffer(store, makeAlert('x2', 'critical', 3000));
    store = addToBuffer(store, makeAlert('x3', 'low', 4000));

    const summary = summarizeBuffer(store);
    expect(summary.count).toBe(3);
    expect(summary.severityCounts['critical']).toBe(2);
    expect(summary.severityCounts['low']).toBe(1);
    expect(summary.oldestAt).toBe(2000);
    expect(summary.newestAt).toBe(4000);
  });

  it('does not flush before interval when not full', () => {
    let store = createBufferStore(50, 10000);
    store = addToBuffer(store, makeAlert('y1', 'medium', 1000));
    expect(shouldFlush(store, store.lastFlushedAt + 500)).toBe(false);
    expect(shouldFlush(store, store.lastFlushedAt + 15000)).toBe(true);
  });
});
