/**
 * workspace.slice/core — Firestore subscription factories (D5-compliant)
 *
 * This module now contains only workspace subcollection subscriptions used by
 * `workspace-provider.tsx`. Account-scoped subscriptions were migrated to
 * `shared/app-providers/account-provider.queries.ts`.
 */

import { db } from '@/shared-infra/frontend-firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  type Unsubscribe,
  query,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';

import type { WorkspaceIssue } from '../business.issues/_types';
import type { WorkspaceTask } from '../business.tasks/_types';
// ---------------------------------------------------------------------------
// Workspace subcollection subscriptions
// ---------------------------------------------------------------------------

/**
 * Opens a real-time listener on `workspaces/{workspaceId}/tasks`.
 * Populates workspace.tasks so tasks/QA/Acceptance/Finance views always
 * reflect current Firestore state without manual refreshes.
 * Managed by WorkspaceProvider; cancelled when the workspace unmounts.
 */
export function subscribeToWorkspaceTasks(
  workspaceId: string,
  onUpdate: (tasks: Record<string, WorkspaceTask>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'workspaces', workspaceId, 'tasks'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onUpdate(snapshotToRecord<WorkspaceTask>(snap)),
    (error) => console.error('[workspace] subscribeToWorkspaceTasks error:', error),
  );
}

/**
 * Opens a real-time listener on `workspaces/{workspaceId}/issues`.
 * Populates workspace.issues so issue creation events from QA / Acceptance /
 * Finance surface immediately without a page reload.
 * Managed by WorkspaceProvider; cancelled when the workspace unmounts.
 */
export function subscribeToWorkspaceIssues(
  workspaceId: string,
  onUpdate: (issues: Record<string, WorkspaceIssue>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'workspaces', workspaceId, 'issues'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onUpdate(snapshotToRecord<WorkspaceIssue>(snap)),
    (error) => console.error('[workspace] subscribeToWorkspaceIssues error:', error),
  );
}
