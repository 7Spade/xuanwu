/**
 * scheduling.slice/_projectors — account-schedule.ts
 *
 * Maintains the account schedule projection.
 * Used by scheduling.slice to filter available accounts.
 *
 * Stored at: scheduleProjection/{accountId}/assignments/{assignmentId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_SCHEDULE
 *   W_B_SCHEDULE -.→ ACCOUNT_PROJECTION_SCHEDULE (過濾可用帳號)
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every Firestore write.
 */

import { serverTimestamp, arrayUnion, arrayRemove, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared-kernel';

export interface AccountScheduleProjection {
  accountId: string;
  /** Active schedule assignment IDs */
  activeAssignmentIds: string[];
  /** Map of scheduleItemId → { workspaceId, startDate, endDate } */
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}

/**
 * Initialises or resets the schedule projection for an account.
 */
export async function initAccountScheduleProjection(accountId: string): Promise<void> {
  await setDocument(`scheduleProjection/${accountId}`, {
    accountId,
    activeAssignmentIds: [],
    assignmentIndex: {},
    readModelVersion: 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Adds a schedule assignment to the projection.
 * Updates both `assignmentIndex` (for detail lookups) and `activeAssignmentIds`
 * (for fast availability filtering).
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyScheduleAssigned(
  accountId: string,
  assignment: AccountScheduleAssignment,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountScheduleProjection>(`scheduleProjection/${accountId}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const docRef = doc(db, `scheduleProjection/${accountId}`);
  await updateDoc(docRef, {
    [`assignmentIndex.${assignment.scheduleItemId}`]: assignment,
    activeAssignmentIds: arrayUnion(assignment.scheduleItemId),
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Marks a schedule assignment as completed in the projection.
 * Removes from `activeAssignmentIds` so availability filters exclude it.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyScheduleCompleted(
  accountId: string,
  scheduleItemId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountScheduleProjection>(`scheduleProjection/${accountId}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const docRef = doc(db, `scheduleProjection/${accountId}`);
  await updateDoc(docRef, {
    [`assignmentIndex.${scheduleItemId}.status`]: 'completed',
    activeAssignmentIds: arrayRemove(scheduleItemId),
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}
