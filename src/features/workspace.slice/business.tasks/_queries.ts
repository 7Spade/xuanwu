/**
 * @fileoverview workspace-business.tasks — Read-only queries.
 * @description Server-side read functions for fetching workspace tasks.
 * Callable from RSC pages, hooks, and context without React dependencies.
 *
 * Per logic-overview.md [R4]: read queries must NOT live in _actions.ts.
 */

import {
  getWorkspaceTasks as getWorkspaceTasksFacade,
  getWorkspaceTask as getWorkspaceTaskFacade,
  getTaskBySourceIntentId as getTaskBySourceIntentIdFacade,
} from "@/shared/infra/firestore/firestore.facade";

import type { WorkspaceTask } from "./_types";


/**
 * Fetches all tasks for a workspace (one-time read, not real-time).
 * @param workspaceId The ID of the workspace.
 */
export async function getWorkspaceTasks(
  workspaceId: string
): Promise<WorkspaceTask[]> {
  return getWorkspaceTasksFacade(workspaceId);
}

/**
 * Fetches a single task by ID from a workspace (one-time read, not real-time).
 * @param workspaceId The ID of the workspace.
 * @param taskId The ID of the task.
 */
export async function getWorkspaceTask(
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null> {
  return getWorkspaceTaskFacade(workspaceId, taskId);
}

/**
 * Returns `true` when at least one task with the given `sourceIntentId` already
 * exists in the workspace — used to enforce source-based deduplication [D14]
 * and prevent a re-import of the same `ParsingIntent` from creating duplicate tasks.
 *
 * @param workspaceId   The workspace to query.
 * @param sourceIntentId The ParsingIntent ID to check against.
 */
export async function hasTasksForSourceIntent(
  workspaceId: string,
  sourceIntentId: string
): Promise<boolean> {
  const task = await getTaskBySourceIntentIdFacade(workspaceId, sourceIntentId);
  return task !== null;
}
