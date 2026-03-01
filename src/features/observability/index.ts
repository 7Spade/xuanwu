/**
 * observability — Public API
 *
 * VS9 OBSERVABILITY_LAYER infrastructure engine. [R8]
 *
 * Nodes:
 *   - TRACE_IDENTIFIER: correlation/trace ID generation and propagation
 *   - DOMAIN_METRICS:   in-process domain event counter
 *   - DOMAIN_ERROR_LOG: structured domain error logger
 *
 * Consumers:
 *   - workspace-core.event-bus: recordEventPublished on every event publish.
 *   - workspace-application: createTraceContext at command entry; logDomainError on failure.
 *   - infra.outbox-relay: logDomainError on relay failure.
 *   - identity.slice: logDomainError on claims refresh failure.
 */
export { generateTraceId, createTraceContext, type TraceContext } from './_trace';
export { recordEventPublished, getEventCounters, resetEventCounters } from './_metrics';
export { logDomainError, type DomainErrorEntry } from './_error-log';
