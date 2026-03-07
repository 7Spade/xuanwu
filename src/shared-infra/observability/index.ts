/**
 * Module: index.ts
 * Purpose: Public export surface for infrastructure observability implementations.
 * Responsibilities: expose trace, metrics, and error logging runtime functions.
 * Constraints: used by runtime/feature orchestration layers, not by shared-kernel.
 */

export { generateTraceId, createTraceContext, traceProvider } from './_trace-provider';
export { recordEventPublished, getEventCounters, resetEventCounters, metricsRecorder } from './_metrics-recorder';
export { logDomainError, errorLogger } from './_error-logger';

export type { TraceContext, DomainErrorEntry, EventCounters, ITraceProvider, IMetricsRecorder, IErrorLogger } from '@/shared-kernel/observability';
