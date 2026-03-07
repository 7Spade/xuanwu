/**
 * Module: _trace.ts
 * Purpose: shared-kernel trace contracts for observability.
 * Responsibilities: define trace data structures and trace provider interface.
 * Constraints: no runtime effects, no clock/random access, contract-only.
 */

/**
 * Structured trace context attached to commands and events.
 */
export interface TraceContext {
  /** Unique trace identifier for the entire command/event chain. */
  readonly traceId: string;
  /** ISO 8601 timestamp when the trace was initiated. */
  readonly initiatedAt: string;
  /** Optional: the command or event type that started this trace. */
  readonly source?: string;
}

/** Infrastructure trace provider contract (implemented in shared-infra). */
export interface ITraceProvider {
  generateTraceId(): string;
  createTraceContext(source?: string): TraceContext;
}
