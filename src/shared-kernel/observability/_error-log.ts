/**
 * Module: _error-log.ts
 * Purpose: shared-kernel error logging contracts for observability.
 * Responsibilities: define domain error entry shape and logger interface.
 * Constraints: contract-only, no sink writes in shared-kernel.
 */

export interface DomainErrorEntry {
  /** ISO 8601 timestamp. */
  readonly occurredAt: string;
  /** Correlation/trace ID of the originating command. */
  readonly traceId: string;
  /** The bounded context or module where the error occurred. */
  readonly source: string;
  /** Human-readable error message. */
  readonly message: string;
  /** Optional serialized error detail. */
  readonly detail?: string;
}

/** Infrastructure error logger contract (implemented in shared-infra). */
export interface IErrorLogger {
  logDomainError(entry: DomainErrorEntry): void;
}
