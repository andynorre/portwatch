export interface SuppressionRule {
  id: string;
  port?: number;
  portRange?: [number, number];
  protocol?: 'tcp' | 'udp';
  process?: string;
  reason: string;
  expiresAt?: number; // epoch ms, undefined = permanent
  createdAt: number;
}

export interface SuppressionStore {
  rules: SuppressionRule[];
}
