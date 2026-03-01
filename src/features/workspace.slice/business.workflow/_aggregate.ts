/**
 * workspace-business.workflow — _aggregate.ts
 *
 * Workflow Aggregate State Machine [R6] WORKFLOW_STATE_CONTRACT
 *
 * Stage lifecycle per v9 spec:
 *   Draft → InProgress → QA → Acceptance → Finance → Completed
 *
 * blockWorkflow:
 *   blockedBy is a Set of issueIds (array representation).
 *   Multiple issues can block simultaneously — they accumulate.
 *
 * unblockWorkflow:
 *   Removes the resolved issueId from blockedBy.
 *   The workflow is only truly unblocked when blockedBy is empty. [R6][D10][A3]
 *
 * Invariant A3: blockWorkflow → blockedBy Set; allIssuesResolved → unblockWorkflow
 * Invariant A8: TX Runner guarantees single-aggregate atomicity per command.
 * D10: Command must validate current Stage legality before execution.
 */

export type WorkflowStage =
  | 'draft'
  | 'in-progress'
  | 'quality-assurance'
  | 'acceptance'
  | 'finance'
  | 'completed';

export interface WorkflowAggregateState {
  workflowId: string;
  workspaceId: string;
  stage: WorkflowStage;
  /**
   * Set of issueIds currently blocking this workflow. [R6]
   * Uses array for Firestore serialization; semantically a Set (no duplicates enforced by blockWorkflow).
   * Workflow is blocked when blockedBy.length > 0.
   * unblockWorkflow only removes one issueId; full unlock requires blockedBy to be empty.
   */
  blockedBy: string[];
  version: number;
  updatedAt: number;
}

export const WORKFLOW_STAGE_ORDER: readonly WorkflowStage[] = [
  'draft',
  'in-progress',
  'quality-assurance',
  'acceptance',
  'finance',
  'completed',
] as const;

export function createWorkflowAggregate(
  workspaceId: string,
  workflowId: string
): WorkflowAggregateState {
  const now = Date.now();
  return {
    workflowId,
    workspaceId,
    stage: 'draft',
    blockedBy: [],
    version: 1,
    updatedAt: now,
  };
}

export function canAdvanceWorkflowStage(
  current: WorkflowStage,
  next: WorkflowStage
): boolean {
  const currentIndex = WORKFLOW_STAGE_ORDER.indexOf(current);
  const nextIndex = WORKFLOW_STAGE_ORDER.indexOf(next);
  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

export function advanceWorkflowStage(
  state: WorkflowAggregateState,
  next: WorkflowStage
): WorkflowAggregateState {
  if (!canAdvanceWorkflowStage(state.stage, next)) {
    throw new Error(
      `Invalid workflow transition: ${state.stage} -> ${next}`
    );
  }
  if (state.blockedBy.length > 0) {
    throw new Error(
      `Workflow ${state.workflowId} is blocked by issues: ${state.blockedBy.join(', ')}. Resolve all issues before advancing.`
    );
  }

  return {
    ...state,
    stage: next,
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Adds issueId to the blockedBy set, blocking the workflow. [R6][D10][A3]
 *
 * Multiple issues can block simultaneously — they accumulate in blockedBy.
 * If the issueId is already present, this is a no-op (idempotent).
 */
export function blockWorkflow(
  state: WorkflowAggregateState,
  issueId: string
): WorkflowAggregateState {
  if (state.blockedBy.includes(issueId)) {
    return state;
  }
  return {
    ...state,
    blockedBy: [...state.blockedBy, issueId],
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Removes issueId from the blockedBy set. [R6][D10][A3]
 *
 * The workflow is only truly unblocked when blockedBy becomes empty
 * (i.e., all blocking issues have been resolved).
 * If the resolvedIssueId is not in the set, this is a no-op (idempotent).
 */
export function unblockWorkflow(
  state: WorkflowAggregateState,
  resolvedIssueId: string
): WorkflowAggregateState {
  if (!state.blockedBy.includes(resolvedIssueId)) {
    return state;
  }
  return {
    ...state,
    blockedBy: state.blockedBy.filter((id) => id !== resolvedIssueId),
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

/** Returns true when the workflow has no active blocking issues. */
export function isWorkflowUnblocked(state: WorkflowAggregateState): boolean {
  return state.blockedBy.length === 0;
}

