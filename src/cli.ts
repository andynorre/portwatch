#!/usr/bin/env node
import { startDaemon, stopDaemon, getDaemonState } from './daemon';

const args = process.argv.slice(2);
const command = args[0];
const configFlag = args.indexOf('--config');
const configPath = configFlag !== -1 ? args[configFlag + 1] : undefined;

async function main() {
  switch (command) {
    case 'start': {
      console.log('[portwatch] Starting...');
      await startDaemon({ configPath });

      process.on('SIGINT', () => {
        console.log('\n[portwatch] Received SIGINT.');
        stopDaemon();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log('[portwatch] Received SIGTERM.');
        stopDaemon();
        process.exit(0);
      });
      break;
    }

    case 'status': {
      const state = getDaemonState();
      console.log('[portwatch] Status:', state.running ? 'running' : 'stopped');
      console.log(`[portwatch] Ticks completed: ${state.tickCount}`);
      break;
    }

    case 'stop': {
      stopDaemon();
      break;
    }

    default: {
      console.log('Usage: portwatch <start|stop|status> [--config <path>]');
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[portwatch] Fatal error:', err);
  process.exit(1);
});
