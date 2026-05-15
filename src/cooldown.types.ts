export interface CooldownEntry {
  key: string;
  firstSeen: number;
  lastSeen: number;
  count: number;
  coolingUntil: number;
}

export interface CooldownStore {
  entries: Record<string, CooldownEntry>;
  windowMs: number;
  maxCount: number;
  cooldownMs: number;
}

export interface CooldownResult {
  allowed: boolean;
  coolingUntil: number | null;
  count: number;
}
