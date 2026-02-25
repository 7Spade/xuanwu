/**
 * infra.observability — Public API
 *
 * OBSERVABILITY_LAYER infrastructure engine. [R8]
 *
 * Per tree.md: infra.observability = [R8] 觀測站 (OpenTelemetry, Log Trace)
 *
 * Consumers:
 *   - workspace-core.event-bus: recordEventPublished on every event publish.
 *   - workspace-application: createTraceContext at command entry; logDomainError on failure.
 */
export { generateTraceId, createTraceContext, type TraceContext } from './_trace';
export { recordEventPublished, getEventCounters, resetEventCounters } from './_metrics';
export { logDomainError, type DomainErrorEntry } from './_error-log';
