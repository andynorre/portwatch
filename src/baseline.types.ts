export interface PortEntry {
  port: number;
  protocol: "tcp" | "udp";
  process: string;
  pid: number;
  user?: string;
}

export interface BaselineStore {
  version: number;
  createdAt: string;
  updatedAt: string;
  ports: PortEntry[];
}

export interface BaselineDiff {
  added: PortEntry[];
  removed: PortEntry[];
  unchanged: PortEntry[];
}
