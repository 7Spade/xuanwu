/**
 * Module: _metrics-recorder
 * Purpose: Provide in-process observability metrics recording.
 * Responsibilities: track event counters and expose snapshots for diagnostics.
 * Constraints: runtime stateful implementation belongs to infrastructure layer.
 */

import type { EventCounters, IMetricsRecorder } from '@/shared-kernel/observability';

const counters: Record<string, number> = {};

export function recordEventPublished(eventType: string): void {
  counters[eventType] = (counters[eventType] ?? 0) + 1;
}

export function getEventCounters(): EventCounters {
  return { ...counters };
}

export function resetEventCounters(): void {
  for (const key of Object.keys(counters)) {
    delete counters[key];
  }
}

/** Default metrics recorder implementation for app runtime wiring. */
export const metricsRecorder: IMetricsRecorder = {
  recordEventPublished,
  getEventCounters,
  resetEventCounters,
};
