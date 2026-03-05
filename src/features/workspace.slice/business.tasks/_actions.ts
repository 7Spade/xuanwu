/**
 * @fileoverview task.commands.ts - Pure business logic for workspace task operations.
 * @description Contains framework-agnostic action functions for creating, updating,
 * and deleting workspace tasks. These functions can be called from React hooks,
 * context, or future Server Actions without any React dependencies.
 */

import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createTask as createTaskFacade,
  updateTask as updateTaskFacade,
  deleteTask as deleteTaskFacade,
  getTasksBySourceIntentId as getTasksBySourceIntentIdFacade,
  reconcileTask as reconcileTaskFacade,
} from "@/shared/infra/firestore/firestore.facade"

import type { WorkspaceTask } from "./_types"

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
    // SourcePointer fields are immutable (Digital Twin anchor) — strip them from updates.
    const {
      sourceIntentId: _sourceIntentId,
      sourceIntentVersion: _sourceIntentVersion,
      sourceFileId: _sourceFileId,
      ...safeUpdates
    } = updates;
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

/**
 * Reconciles a set of incoming parse items against tasks materialised from a
 * superseded intent [#A4].
 *
 * **Matching rule**: items are matched to existing tasks by exact `name`.
 *
 * **Per-item decision table**:
 * - Old task found AND `progressState === 'todo'`
 *   → update the task's mutable line-item fields (qty / price / discount / subtotal)
 *     **and** re-point `sourceIntentId` / `sourceIntentVersion` to the new intent so
 *     subsequent idempotency guards work correctly.
 * - Old task found BUT in any other state (doing / blocked / completed / …)
 *   → create a **new** task; the in-progress work is left untouched.
 * - No old task found for this item name
 *   → create a **new** task (net-new line item introduced in the re-parse).
 *
 * This means a re-parse of a 12-item invoice where 9 items already exist in
 * `todo` state produces 9 updates + 3 creates (12 tasks total) instead of
 * 9 originals + 12 new = 21 tasks.
 *
 * @param workspaceId        Workspace that owns the tasks.
 * @param oldIntentId        The superseded ParsingIntent whose tasks we reconcile against.
 * @param newIntentId        The new ParsingIntent that produced the incoming items.
 * @param newIntentVersion   The version number associated with the new intent.
 * @param items              Incoming parsed line items (from the document-parser).
 * @param baseTaskData       Static fields (e.g. workspace / org ids) shared by all tasks.
 */

/**
 * Spreads a `discount` field into an object only when the value is defined.
 * Omitting undefined values is required because Firestore rejects writes containing
 * `undefined` field values.
 */
const withDiscount = (discount: number | undefined): { discount: number } | Record<string, never> =>
  discount !== undefined ? { discount } : {};

export async function reconcileIntentTasks(
  workspaceId: string,
  oldIntentId: string,
  newIntentId: string,
  newIntentVersion: number,
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    discount?: number
    subtotal: number
    sourceIntentIndex?: number
  }>,
  baseTaskData: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt" | "name" | "quantity" | "unitPrice" | "discount" | "subtotal" | "sourceIntentId" | "sourceIntentVersion">
): Promise<CommandResult> {
  try {
    // Load all tasks currently linked to the superseded intent.
    const oldTasks = await getTasksBySourceIntentIdFacade(workspaceId, oldIntentId);
    // Build a lookup map keyed by task name for O(1) matching.
    const oldTasksByName = new Map<string, WorkspaceTask>(
      oldTasks.map((t) => [t.name, t])
    );

    await Promise.all(
      items.map(async (item) => {
        const oldTask = oldTasksByName.get(item.name);

        if (oldTask && oldTask.progressState === 'todo') {
          // Update the existing task's line-item data and re-point it to the new intent.
          await reconcileTaskFacade(workspaceId, oldTask.id, {
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            ...withDiscount(item.discount),
            subtotal: item.subtotal,
            sourceIntentId: newIntentId,
            sourceIntentVersion: newIntentVersion,
            ...(item.sourceIntentIndex !== undefined ? { sourceIntentIndex: item.sourceIntentIndex } : {}),
          });
        } else {
          // Either no matching old task or the existing task is in progress — create new.
          await createTaskFacade(workspaceId, {
            ...baseTaskData,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            ...withDiscount(item.discount),
            subtotal: item.subtotal,
            sourceIntentId: newIntentId,
            sourceIntentVersion: newIntentVersion,
            ...(item.sourceIntentIndex !== undefined ? { sourceIntentIndex: item.sourceIntentIndex } : {}),
          });
        }
      })
    );

    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('TASK_RECONCILE_FAILED', message);
  }
}