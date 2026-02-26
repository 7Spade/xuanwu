/**
 * shared-kernel.command-result-contract [R4]
 *
 * Defines the canonical result shape returned by every Command Handler after
 * a command executes through the CBG_ROUTE → Slice pipeline.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   CommandSuccess → { aggregateId, version }   (frontend optimistic-update basis)
 *   CommandFailure → DomainError { code, message, context }  (structured error)
 *
 * Invariant #8: Shared Kernel contracts must be explicitly agreed cross-BC.
 * D4: new slice onboarding must adopt this contract for all command outputs.
 */

/**
 * Structured domain error — returned on CommandFailure.
 * Consumers must NOT catch raw Error objects; use DomainError for structured handling.
 */
export interface DomainError {
  /** Machine-readable error code, e.g. "SKILL_TIER_INSUFFICIENT" or "WORKSPACE_ACCESS_DENIED". */
  readonly code: string;
  /** Human-readable description of the error. */
  readonly message: string;
  /** Optional diagnostic context (aggregate IDs, field values, etc.) for observability. */
  readonly context?: Record<string, unknown>;
}

/**
 * Successful command result.
 * The frontend uses { aggregateId, version } as the basis for optimistic updates:
 * it can poll or subscribe to projections until the version appears.
 */
export interface CommandSuccess {
  readonly success: true;
  /** ID of the aggregate that was mutated by this command. */
  readonly aggregateId: string;
  /** Aggregate version after the command was applied. */
  readonly version: number;
}

/**
 * Failed command result.
 * Always carries a structured DomainError — no raw string messages.
 */
export interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}

/** Union type returned by every Command Handler. */
export type CommandResult = CommandSuccess | CommandFailure;

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/** Creates a CommandSuccess result. */
export function commandSuccess(aggregateId: string, version: number): CommandSuccess {
  return { success: true, aggregateId, version };
}

/** Creates a CommandFailure result from a DomainError. */
export function commandFailure(error: DomainError): CommandFailure {
  return { success: false, error };
}

/** Creates a CommandFailure result from a plain code + message (convenience overload). */
export function commandFailureFrom(
  code: string,
  message: string,
  context?: Record<string, unknown>
): CommandFailure {
  return commandFailure({ code, message, context });
}
