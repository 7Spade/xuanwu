import {
  advanceWorkflowStage,
  createWorkflowAggregate,
  WORKFLOW_STAGE_ORDER,
  type WorkflowAggregateState,
  type WorkflowStage,
} from './_aggregate';
import { loadWorkflowState, saveWorkflowState } from './_persistence';

export async function advanceWorkflowToStage(
  workspaceId: string,
  targetStage: WorkflowStage,
  workflowId = workspaceId,
): Promise<WorkflowAggregateState> {
  const current = (await loadWorkflowState(workspaceId, workflowId))
    ?? createWorkflowAggregate(workspaceId, workflowId);

  if (current.blockedBy.length > 0) {
    return current;
  }

  const currentIndex = WORKFLOW_STAGE_ORDER.indexOf(current.stage);
  const targetIndex = WORKFLOW_STAGE_ORDER.indexOf(targetStage);

  if (currentIndex < 0 || targetIndex < 0 || targetIndex <= currentIndex) {
    return current;
  }

  let nextState = current;
  for (let index = currentIndex + 1; index <= targetIndex; index += 1) {
    nextState = advanceWorkflowStage(nextState, WORKFLOW_STAGE_ORDER[index]);
  }

  await saveWorkflowState(nextState);
  return nextState;
}
