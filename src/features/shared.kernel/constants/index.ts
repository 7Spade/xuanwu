/**
 * shared.kernel/constants — Cross-BC shared enumerations and error codes
 *
 * VS0 Shared Kernel: Canonical status enums and error codes shared across all BCs.
 *
 * Per logic-overview.md [R6] WORKFLOW_STATE_CONTRACT:
 *   WorkflowStatus defines the legal state transitions for workspace business workflows.
 *   Legal transitions only: Draft → InProgress → QA → Acceptance → Finance → Completed
 *
 * Per logic-overview.md [R4]:
 *   ErrorCodes are the canonical machine-readable codes used in CommandFailure.DomainError.
 *
 * Rule: Any BC may reference these constants; no BC may re-declare them locally.
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Workflow status ──────────────────────────────────────────────────────────

/**
 * Canonical workspace business workflow lifecycle statuses. [R6]
 *
 * Legal state transitions (closed set — additions require updating logic-overview.md):
 *   draft → in_review → approved → in_progress → completed
 *                     ↘ rejected
 *   any → cancelled
 */
export const WorkflowStatusValues = [
  'draft',
  'in_review',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type WorkflowStatus = (typeof WorkflowStatusValues)[number];

// ─── Domain error codes ───────────────────────────────────────────────────────

/**
 * Canonical domain error codes for CommandFailure.DomainError.code. [R4]
 *
 * Slices may define slice-local error codes alongside these shared ones,
 * but cross-BC errors MUST use these canonical codes.
 */
export const ErrorCodes = {
  NOT_FOUND:        'NOT_FOUND',
  UNAUTHORIZED:     'UNAUTHORIZED',
  FORBIDDEN:        'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT:         'CONFLICT',
  INTERNAL_ERROR:   'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
