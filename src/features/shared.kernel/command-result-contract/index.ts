/**
 * shared.kernel/command-result-contract — SK_CMD_RESULT [R4]
 *
 * VS0 Shared Kernel: Canonical command result shape.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   Every Server Action (_actions.ts) MUST return CommandResult.
 *   CommandSuccess → { aggregateId, version }     (frontend optimistic-update basis)
 *   CommandFailure → DomainError { code, message } (structured error; never raw Error)
 *
 * Consumers:
 *   — All _actions.ts exports across every slice
 *   — infra.gateway-command (CBG_ROUTE response) [R4]
 *   — Frontend components performing optimistic updates
 *
 * Invariant [D4]: New slices MUST adopt CommandResult for all command outputs.
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Structured error ─────────────────────────────────────────────────────────

/**
 * Structured domain error returned in CommandFailure.
 *
 * Consumers MUST NOT catch raw `Error` objects for command results.
 * Always use DomainError for cross-BC structured error handling.
 */
export interface DomainError {
  /** Machine-readable error code, e.g. "SKILL_TIER_INSUFFICIENT". */
  readonly code: string;
  /** Human-readable description. */
  readonly message: string;
  /** Optional diagnostic context (aggregate IDs, field values, etc.) for observability. */
  readonly context?: Record<string, unknown>;
}

// ─── Result shapes ────────────────────────────────────────────────────────────

/**
 * Successful command result. [R4]
 *
 * Frontend uses { aggregateId, version } as the optimistic-update basis:
 * poll / subscribe to the Projection until the expected version appears.
 */
export interface CommandSuccess {
  readonly success: true;
  /** ID of the aggregate mutated by this command. */
  readonly aggregateId: string;
  /** Aggregate version AFTER the command was applied. */
  readonly version: number;
}

/**
 * Failed command result. [R4]
 *
 * Always carries a structured DomainError — no raw string messages.
 */
export interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}

/** Union returned by every Command Handler / _actions.ts export. */
export type CommandResult = CommandSuccess | CommandFailure;

// ─── Factory helpers ──────────────────────────────────────────────────────────

/** Creates a CommandSuccess result. */
export function commandSuccess(aggregateId: string, version: number): CommandSuccess {
  return { success: true, aggregateId, version };
}

/** Creates a CommandFailure from a DomainError. */
export function commandFailure(error: DomainError): CommandFailure {
  return { success: false, error };
}

/** Creates a CommandFailure from a plain code + message pair. */
export function commandFailureFrom(
  code: string,
  message: string,
  context?: Record<string, unknown>,
): CommandFailure {
  return commandFailure({ code, message, context });
}
