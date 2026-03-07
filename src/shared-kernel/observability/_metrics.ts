/**
 * Module: _metrics.ts
 * Purpose: shared-kernel metrics contracts for observability.
 * Responsibilities: define metrics shapes and recorder interface.
 * Constraints: contract-only, no mutable runtime state.
 */

/** Snapshot type returned by a metrics recorder implementation. */
export type EventCounters = Readonly<Record<string, number>>;

/** Infrastructure metrics recorder contract (implemented in shared-infra). */
export interface IMetricsRecorder {
  recordEventPublished(eventType: string): void;
  getEventCounters(): EventCounters;
  resetEventCounters(): void;
}
