import type { MergeStrategy } from "./baseline.merge";

export interface BaselineMergeOptions {
  strategy: MergeStrategy;
  /** Maximum number of port entries to retain after merge (0 = unlimited). */
  maxEntries: number;
}

export const DEFAULT_MERGE_OPTIONS: BaselineMergeOptions = {
  strategy: "union",
  maxEntries: 0,
};
