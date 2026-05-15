import {
  getPipelineState,
  resetPipelineState,
  buildStep,
  createPipelineResult,
  runPipeline,
} from './pipeline';

beforeEach(() => {
  resetPipelineState();
});

describe('buildStep', () => {
  it('creates a step with no error', () => {
    const step = buildStep('scan', true, 42);
    expect(step.stage).toBe('scan');
    expect(step.enabled).toBe(true);
    expect(step.durationMs).toBe(42);
    expect(step.error).toBeUndefined();
  });

  it('creates a step with an error', () => {
    const step = buildStep('filter', true, 10, 'oops');
    expect(step.error).toBe('oops');
  });
});

describe('createPipelineResult', () => {
  it('marks success when no step has an error', () => {
    const steps = [buildStep('scan', true, 5), buildStep('alert', true, 3)];
    const result = createPipelineResult(steps, 2, Date.now() - 100);
    expect(result.success).toBe(true);
    expect(result.alertsGenerated).toBe(2);
    expect(result.runId).toBeTruthy();
  });

  it('marks failure when any step has an error', () => {
    const steps = [buildStep('scan', true, 5, 'fail')];
    const result = createPipelineResult(steps, 0, Date.now());
    expect(result.success).toBe(false);
  });
});

describe('runPipeline', () => {
  it('runs all stages and records results', async () => {
    const result = await runPipeline([
      { stage: 'scan', fn: async () => {} },
      { stage: 'alert', fn: async () => 3 },
    ]);
    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(2);
    expect(result.alertsGenerated).toBe(3);
    expect(getPipelineState().totalRuns).toBe(1);
    expect(getPipelineState().totalFailures).toBe(0);
  });

  it('stops on first error and marks failure', async () => {
    const result = await runPipeline([
      { stage: 'scan', fn: async () => { throw new Error('scan failed'); } },
      { stage: 'alert', fn: async () => 5 },
    ]);
    expect(result.success).toBe(false);
    expect(result.steps).toHaveLength(1);
    expect(result.alertsGenerated).toBe(0);
    expect(getPipelineState().totalFailures).toBe(1);
  });

  it('throws if pipeline is already running', async () => {
    const slow = runPipeline([{ stage: 'scan', fn: () => new Promise((r) => setTimeout(r, 50)) }]);
    await expect(runPipeline([{ stage: 'scan', fn: async () => {} }])).rejects.toThrow('already running');
    await slow;
  });

  it('updates lastResult after run', async () => {
    await runPipeline([{ stage: 'notify', fn: async () => {} }]);
    expect(getPipelineState().lastResult).not.toBeNull();
    expect(getPipelineState().lastResult?.steps[0].stage).toBe('notify');
  });
});
