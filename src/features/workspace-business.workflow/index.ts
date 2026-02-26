export {
  WORKFLOW_STAGE_ORDER,
  createWorkflowAggregate,
  canAdvanceWorkflowStage,
  advanceWorkflowStage,
  blockWorkflow,
  unblockWorkflow,
  isWorkflowUnblocked,
} from './_aggregate';
export type { WorkflowStage, WorkflowAggregateState } from './_aggregate';

export {
  loadWorkflowState,
  saveWorkflowState,
  updateWorkflowState,
  findWorkflowsBlockedByIssue,
  findWorkflowsByStage,
} from './_persistence';

/** [R6] IssueResolved event handler — ONLY trigger for blockedBy.delete(issueId) */
export { handleIssueResolvedForWorkflow } from './_issue-handler';
