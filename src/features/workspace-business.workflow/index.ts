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
