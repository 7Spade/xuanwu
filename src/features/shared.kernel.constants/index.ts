/**
 * shared.kernel.constants — Public API
 *
 * 跨切片共用狀態 (如: WorkflowStatus, ErrorCodes)
 *
 * Per tree.md: shared.kernel.constants = cross-slice shared status enums and error codes
 *   that any bounded context may reference without creating a coupling to a specific feature.
 *
 * Per logic-overview_v9.md: sole canonical source for cross-BC status enums.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/** Canonical workflow lifecycle statuses shared across workspace business slices. */
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

/** Canonical domain error codes used by CommandResult failures. */
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
