import { randomUUID } from 'crypto';
import { PipelineResult, PipelineState, PipelineStep, PipelineStage } from './pipeline.types';

let state: PipelineState = {
  running: false,
  lastResult: null,
  totalRuns: 0,
  totalFailures: 0,
};

export function getPipelineState(): Readonly<PipelineState> {
  return { ...state };
}

export function resetPipelineState(): void {
  state = {
    running: false,
    lastResult: null,
    totalRuns: 0,
    totalFailures: 0,
  };
}

export function createPipelineResult(steps: PipelineStep[], alertsGenerated: number, startedAt: number): PipelineResult {
  const finishedAt = Date.now();
  const success = steps.every((s) => !s.error);
  return {
    runId: randomUUID(),
    startedAt,
    finishedAt,
    steps,
    success,
    alertsGenerated,
  };
}

export function buildStep(stage: PipelineStage, enabled: boolean, durationMs: number, error?: string): PipelineStep {
  return { stage, enabled, durationMs, error };
}

export async function runPipeline(
  stages: Array<{ stage: PipelineStage; fn: () => Promise<number | void> }>
): Promise<PipelineResult> {
  if (state.running) {
    throw new Error('Pipeline is already running');
  }
  state.running = true;
  const startedAt = Date.now();
  const steps: PipelineStep[] = [];
  let alertsGenerated = 0;

  for (const { stage, fn } of stages) {
    const t0 = Date.now();
    try {
      const result = await fn();
      if (typeof result === 'number') alertsGenerated += result;
      steps.push(buildStep(stage, true, Date.now() - t0));
    } catch (err) {
      steps.push(buildStep(stage, true, Date.now() - t0, String(err)));
      break;
    }
  }

  const result = createPipelineResult(steps, alertsGenerated, startedAt);
  state.running = false;
  state.lastResult = result;
  state.totalRuns += 1;
  if (!result.success) state.totalFailures += 1;
  return result;
}
