/**
 * workspace.slice/core — Firestore subscription factories (D5-compliant)
 *
 * Encapsulates all `onSnapshot` / Firestore read-adapter calls so that
 * `account-provider.tsx` (and any other client component) has zero direct
 * infra imports per D5.
 *
 * Pattern follows `business.files/_queries.ts` — all Firestore API surface
 * stays in this file; callbacks receive typed domain records.
 */

import type { ScheduleItem } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type { PartnerInvite } from '@/features/shared-kernel';

import type { DailyLog } from '../business.daily/_types';
import type { WorkspaceIssue } from '../business.issues/_types';
import type { WorkspaceTask } from '../business.tasks/_types';
import type { AuditLog } from '../gov.audit/_types';

import type { Workspace } from './_types';

// ---------------------------------------------------------------------------
// Account-scoped subscriptions
// ---------------------------------------------------------------------------

/**
 * Opens a real-time listener on `accounts/{accountId}/dailyLogs`.
 * Calls `onUpdate` with the latest records map on every change.
 */
export function subscribeToDailyLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, DailyLog>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'dailyLogs'),
    orderBy('recordedAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<DailyLog>(snap)));
}

/**
 * Opens a real-time listener on `accounts/{accountId}/auditLogs`.
 */
export function subscribeToAuditLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, AuditLog>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'auditLogs'),
    orderBy('recordedAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<AuditLog>(snap)));
}

/**
 * Opens a real-time listener on `accounts/{accountId}/invites`.
 */
export function subscribeToInvitesForAccount(
  accountId: string,
  onUpdate: (invites: Record<string, PartnerInvite>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'invites'),
    orderBy('invitedAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    onUpdate(snapshotToRecord<PartnerInvite>(snap)),
  );
}

/**
 * Opens a real-time listener on `accounts/{accountId}/schedule_items`.
 */
export function subscribeToScheduleItemsForAccount(
  accountId: string,
  onUpdate: (items: Record<string, ScheduleItem>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'schedule_items'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    onUpdate(snapshotToRecord<ScheduleItem>(snap)),
  );
}

/**
 * Opens a real-time listener on `workspaces` filtered by `dimensionId`.
 */
export function subscribeToWorkspacesForAccount(
  dimensionId: string,
  onUpdate: (workspaces: Record<string, Workspace>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'workspaces'),
    where('dimensionId', '==', dimensionId),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<Workspace>(snap)));
}

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
