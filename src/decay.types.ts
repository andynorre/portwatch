export interface DecayConfig {
  halfLifeMs: number;    // time after which weight is halved
  minWeight: number;     // floor — entries below this are pruned
  maxWeight: number;     // ceiling applied on insertion
}

export interface DecayEntry {
  key: string;
  weight: number;
  lastSeenAt: number;    // epoch ms
}

export interface DecayStore {
  entries: Map<string, DecayEntry>;
  config: DecayConfig;
}
