/**
 * @fileoverview workspace-business.files — Firestore CRUD actions.
 *
 * Wraps createWorkspaceFile, addWorkspaceFileVersion, and
 * restoreWorkspaceFileVersion so that UI components (files-view.tsx) do not
 * import from @/shared/infra directly.
 *
 * [D3]  All mutations live here — not in _components/.
 * [D5]  UI components must not import src/shared/infra; use this module.
 * [R4]  All exported functions return CommandResult (commandSuccess / commandFailureFrom).
 */

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/features/shared-kernel';
import {
  createWorkspaceFile as createFileFacade,
  addWorkspaceFileVersion as addVersionFacade,
  restoreWorkspaceFileVersion as restoreVersionFacade,
} from '@/shared/infra/firestore/firestore.facade';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WorkspaceFile, WorkspaceFileVersion } from '@/shared/types';

export type CreateWorkspaceFileInput = Omit<WorkspaceFile, 'id' | 'updatedAt'>;

/**
 * Creates a new file document in the workspace files subcollection.
 * Adds a server-generated `updatedAt` sentinel automatically so that UI
 * components do not need to import `serverTimestamp` from the infra layer.
 *
 * [R4] Returns CommandResult so callers handle failures without try/catch.
 *
 * @param workspaceId The ID of the workspace.
 * @param fileData    File metadata without `id` or `updatedAt`.
 */
export async function createWorkspaceFile(
  workspaceId: string,
  fileData: CreateWorkspaceFileInput
): Promise<CommandResult> {
  try {
    const fileId = await createFileFacade(workspaceId, {
      ...fileData,
      updatedAt: serverTimestamp(),
    });
    return commandSuccess(fileId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'CREATE_WORKSPACE_FILE_FAILED',
      err instanceof Error ? err.message : 'Failed to create workspace file'
    );
  }
}

/**
 * Appends a new version to an existing workspace file and marks it as current.
 *
 * [R4] Returns CommandResult so callers handle failures without try/catch.
 *
 * @param workspaceId      The ID of the workspace.
 * @param fileId           The ID of the file document.
 * @param version          The new version object to append.
 * @param currentVersionId The versionId to mark as the active version.
 */
export async function addWorkspaceFileVersion(
  workspaceId: string,
  fileId: string,
  version: WorkspaceFileVersion,
  currentVersionId: string
): Promise<CommandResult> {
  try {
    await addVersionFacade(workspaceId, fileId, version, currentVersionId);
    return commandSuccess(fileId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'ADD_WORKSPACE_FILE_VERSION_FAILED',
      err instanceof Error ? err.message : 'Failed to add workspace file version'
    );
  }
}

/**
 * Restores a workspace file to a specific past version by updating
 * `currentVersionId`.
 *
 * [R4] Returns CommandResult so callers handle failures without try/catch.
 *
 * @param workspaceId The ID of the workspace.
 * @param fileId      The ID of the file document.
 * @param versionId   The versionId to restore as the active version.
 */
export async function restoreWorkspaceFileVersion(
  workspaceId: string,
  fileId: string,
  versionId: string
): Promise<CommandResult> {
  try {
    await restoreVersionFacade(workspaceId, fileId, versionId);
    return commandSuccess(fileId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'RESTORE_WORKSPACE_FILE_VERSION_FAILED',
      err instanceof Error ? err.message : 'Failed to restore workspace file version'
    );
  }
}
