export interface PortRange {
  min: number;
  max: number;
}

export interface FilterConfig {
  protocols?: ('tcp' | 'udp')[];
  portRange?: PortRange;
  excludePorts?: number[];
  includePorts?: number[];
  excludeProcesses?: string[];
}

export interface FilterResult {
  original: number;
  filtered: number;
  removed: number;
}
