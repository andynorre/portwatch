export type PipelineStage = 'scan' | 'filter' | 'diff' | 'classify' | 'alert' | 'notify';

export interface PipelineStep {
  stage: PipelineStage;
  enabled: boolean;
  durationMs: number;
  error?: string;
}

export interface PipelineResult {
  runId: string;
  startedAt: number;
  finishedAt: number;
  steps: PipelineStep[];
  success: boolean;
  alertsGenerated: number;
}

export interface PipelineState {
  running: boolean;
  lastResult: PipelineResult | null;
  totalRuns: number;
  totalFailures: number;
}
