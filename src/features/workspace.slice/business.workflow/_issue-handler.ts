/**
 * workspace-business.workflow — _issue-handler.ts
 *
 * Handles the B-track `IssueResolved` domain event for the Workflow aggregate.
 *
 * Per logic-overview.md [R6] WORKFLOW_STATE_CONTRACT:
 *   IssueResolved event → blockedBy.delete(issueId)  (ONLY trigger)
 *   B-Track communicates back to A-Track ONLY via Domain Event — never a direct call.
 *
 * This handler subscribes to `workspace:issues:resolved` on the workspace event bus,
 * finds all workflows in the workspace blocked by the resolved issue,
 * and calls `unblockWorkflow` for each one before persisting the updated state.
 *
 * Per GEMINI.md A-Track / B-Track Recovery Principle:
 *   B-Track MUST NOT directly call back into A-Track.
 *   B-Track communicates back ONLY via Domain Event.
 *   Here: IssueResolved event → IER → this handler → unblockWorkflow (pure domain fn)
 */

import { blockWorkflow, createWorkflowAggregate, isWorkflowUnblocked, unblockWorkflow } from './_aggregate';
import { findWorkflowsBlockedByIssue, loadWorkflowState, saveWorkflowState } from './_persistence';

export interface WorkflowIssueBlockedResult {
  workflowId: string;
  blockedByCount: number;
  wasChanged: boolean;
}

export interface WorkflowIssueResolvedResult {
  touchedWorkflowIds: string[];
  unblockedWorkflowIds: string[];
}

/**
 * Handles `workspace:issues:resolved` by removing the issueId from the `blockedBy`
 * set of every workflow in the workspace that was blocked by it. [R6]
 *
 * Call this from the workspace event bus subscriber at app startup.
 */
async function getOrCreateWorkflowState(
  workspaceId: string,
  workflowId: string
) {
  const existing = await loadWorkflowState(workspaceId, workflowId);
  return existing ?? createWorkflowAggregate(workspaceId, workflowId);
}

export async function handleIssueCreatedForWorkflow(
  workspaceId: string,
  issueId: string,
  workflowId = workspaceId
): Promise<WorkflowIssueBlockedResult> {
  // Create-if-missing behavior keeps blockedBy ownership inside workflow aggregate
  // even when no workflow state document exists yet for this workspace.
  const current = await getOrCreateWorkflowState(workspaceId, workflowId);
  const updated = blockWorkflow(current, issueId);
  const wasChanged = updated !== current;

  if (wasChanged) {
    await saveWorkflowState(updated);
  }

  return {
    workflowId: updated.workflowId,
    blockedByCount: updated.blockedBy.length,
    wasChanged,
  };
}

export async function handleIssueResolvedForWorkflow(
  workspaceId: string,
  issueId: string
): Promise<WorkflowIssueResolvedResult> {
  const blockedWorkflows = await findWorkflowsBlockedByIssue(workspaceId, issueId);
  const touchedWorkflowIds: string[] = [];
  const unblockedWorkflowIds: string[] = [];

  for (const workflowState of blockedWorkflows) {
    const updated = unblockWorkflow(workflowState, issueId);
    if (updated !== workflowState) {
      await saveWorkflowState(updated);
      touchedWorkflowIds.push(updated.workflowId);
      if (isWorkflowUnblocked(updated)) {
        unblockedWorkflowIds.push(updated.workflowId);
      }
    }
  }

  return {
    touchedWorkflowIds,
    unblockedWorkflowIds,
  };
}
