/**
 * @fileoverview task.commands.ts - Pure business logic for workspace task operations.
 * @description Contains framework-agnostic action functions for creating, updating,
 * and deleting workspace tasks. These functions can be called from React hooks,
 * context, or future Server Actions without any React dependencies.
 */

import {
  createTask as createTaskFacade,
  updateTask as updateTaskFacade,
  deleteTask as deleteTaskFacade,
} from "@/shared/infra/firestore/firestore.facade"
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel/command-result-contract';
import type { WorkspaceTask } from "@/shared/types"

export async function createTask(
  workspaceId: string,
  taskData: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">
): Promise<CommandResult> {
  try {
    const taskId = await createTaskFacade(workspaceId, taskData);
    return commandSuccess(taskId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TASK_CREATE_FAILED', message);
  }
}

export async function updateTask(
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<CommandResult> {
  try {
    // sourceIntentId is a readonly SourcePointer (Digital Twin anchor) — strip it from updates.
    const { sourceIntentId: _sourceIntentId, ...safeUpdates } = updates;
    await updateTaskFacade(workspaceId, taskId, safeUpdates);
    return commandSuccess(taskId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TASK_UPDATE_FAILED', message);
  }
}

export async function deleteTask(
  workspaceId: string,
  taskId: string
): Promise<CommandResult> {
  try {
    await deleteTaskFacade(workspaceId, taskId);
    return commandSuccess(taskId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TASK_DELETE_FAILED', message);
  }
}

/**
 * Imports multiple tasks into a workspace in parallel.
 * @param workspaceId The ID of the workspace.
 * @param items Array of task data objects to create (without id/timestamps).
 * @returns CommandResult reflecting overall success or the first failure encountered.
 */
export async function batchImportTasks(
  workspaceId: string,
  items: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">[]
): Promise<CommandResult> {
  try {
    await Promise.all(items.map((item) => createTaskFacade(workspaceId, item)));
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TASK_BATCH_IMPORT_FAILED', message);
  }
}


