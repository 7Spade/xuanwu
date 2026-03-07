/**
 * observability — Public API
 *
 * VS9 OBSERVABILITY_LAYER contract API. [R8]
 *
 * This module defines contracts only. Runtime implementations live in:
 *   src/shared-infra/observability
 */
export type { TraceContext, ITraceProvider } from './_trace';
export type { EventCounters, IMetricsRecorder } from './_metrics';
export type { DomainErrorEntry, IErrorLogger } from './_error-log';
