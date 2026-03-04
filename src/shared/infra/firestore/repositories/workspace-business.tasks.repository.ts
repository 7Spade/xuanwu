/**
 * @fileoverview Workspace Business — Tasks Repository.
 *
 * All Firestore read and write operations for the `tasks` sub-collection
 * under a workspace. Stored at: workspaces/{workspaceId}/tasks/{taskId}
 * Corresponds to the `workspace-business.tasks` feature slice.
 */

import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  where,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';

import type { WorkspaceTask } from '@/features/workspace.slice';

import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';

/**
 * Creates a new task in a specific workspace.
 * @param workspaceId The ID of the workspace.
 * @param taskData The data for the new task.
 * @returns The ID of the newly created task.
 */
export const createTask = async (
  workspaceId: string,
  taskData: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const dataWithTimestamp = {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDocument(
    `workspaces/${workspaceId}/tasks`,
    dataWithTimestamp
  );
  return docRef.id;
};

/**
 * Updates an existing task in a workspace.
 * @param workspaceId The ID of the workspace.
 * @param taskId The ID of the task to update.
 * @param updates The fields to update on the task.
 */
export const updateTask = async (
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<void> => {
  const {
    sourceIntentId: _sourceIntentId,
    sourceIntentVersion: _sourceIntentVersion,
    sourceFileId: _sourceFileId,
    ...safeUpdates
  } = updates;

  const dataWithTimestamp = {
    ...safeUpdates,
    updatedAt: serverTimestamp(),
  };
  return updateDocument(
    `workspaces/${workspaceId}/tasks/${taskId}`,
    dataWithTimestamp
  );
};

/**
 * Deletes a task from a workspace.
 * @param workspaceId The ID of the workspace.
 * @param taskId The ID of the task to delete.
 */
export const deleteTask = async (
  workspaceId: string,
  taskId: string
): Promise<void> => {
  return deleteDocument(`workspaces/${workspaceId}/tasks/${taskId}`);
};

export const getWorkspaceTasks = async (
  workspaceId: string
): Promise<WorkspaceTask[]> => {
  const converter = createConverter<WorkspaceTask>();
  const colRef = collection(
    db,
    `workspaces/${workspaceId}/tasks`
  ).withConverter(converter);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return getDocuments(q);
};

export const getWorkspaceTask = async (
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null> => {
  const converter = createConverter<WorkspaceTask>();
  const docRef = doc(db, `workspaces/${workspaceId}/tasks/${taskId}`).withConverter(converter);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

/**
 * Returns the first task whose `sourceIntentId` matches the given intent ID,
 * or `null` if no tasks have been materialised for that intent yet.
 *
 * Used by the source-based deduplication guard [D14] to prevent a second
 * import of the same `ParsingIntent` from creating duplicate tasks.
 */
// [INDEX] Firestore auto-creates single-field indexes for each collection field,
// so a plain equality filter on `sourceIntentId` works without a manual composite
// index.  If a composite index (e.g. sourceIntentId + createdAt) is later needed,
// add it to firestore.indexes.json.
export const getTaskBySourceIntentId = async (
  workspaceId: string,
  sourceIntentId: string
): Promise<WorkspaceTask | null> => {
  const converter = createConverter<WorkspaceTask>();
  const colRef = collection(
    db,
    `workspaces/${workspaceId}/tasks`
  ).withConverter(converter);
  const q = query(colRef, where('sourceIntentId', '==', sourceIntentId), limit(1));
  const results = await getDocuments(q);
  return results[0] ?? null;
};
