export {
  WORKFLOW_STAGE_ORDER,
  createWorkflowAggregate,
  canAdvanceWorkflowStage,
  advanceWorkflowStage,
  blockWorkflow,
  isWorkflowUnblocked,
} from './_aggregate';
export type { WorkflowStage, WorkflowAggregateState } from './_aggregate';

export { advanceWorkflowToStage } from './_stage-transition';

export {
  loadWorkflowState,
  saveWorkflowState,
  updateWorkflowState,
  findWorkflowsBlockedByIssue,
  findWorkflowsByStage,
  listWorkflowStates,
} from './_persistence';

/** [R6] B-track workflow handlers — issue create/resolve mutate blockedBy set. */
export { handleIssueCreatedForWorkflow, handleIssueResolvedForWorkflow } from './_issue-handler';
