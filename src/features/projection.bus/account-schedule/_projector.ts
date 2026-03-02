/**
 * projection.account-schedule — _projector.ts
 *
 * Maintains the account schedule projection read model.
 * Tracks active schedule assignments per account for availability filtering.
 *
 * Stored at: scheduleProjection/{accountId}
 *
 * Per logic-overview.md (PROJ_BUS STD_PROJ):
 *   ACC_SCHED_V["projection.account-schedule"]
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_SCHEDULE
 *   ORG_SCH -.→ ACCOUNT_PROJECTION_SCHEDULE (過濾可用帳號)
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 */

import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';

import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';

export interface AccountScheduleProjection {
  accountId: string;
  /** Active schedule assignment IDs */
  activeAssignmentIds: string[];
  /** Map of scheduleItemId → assignment detail */
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
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyScheduleAssigned(
  accountId: string,
  assignment: AccountScheduleAssignment,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  const existing = await getDocument<AccountScheduleProjection>(
    `scheduleProjection/${accountId}`
  );

  if (aggregateVersion !== undefined) {
    if (
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
      })
    ) {
      return;
    }
  }

  const currentActiveIds = existing?.activeAssignmentIds ?? [];
  const currentIndex = existing?.assignmentIndex ?? {};

  const updatedRecord: Omit<AccountScheduleProjection, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    accountId,
    activeAssignmentIds: currentActiveIds.includes(assignment.scheduleItemId)
      ? currentActiveIds
      : [...currentActiveIds, assignment.scheduleItemId],
    assignmentIndex: {
      ...currentIndex,
      [assignment.scheduleItemId]: assignment,
    },
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDocument(`scheduleProjection/${accountId}`, updatedRecord);
}

/**
 * Marks a schedule assignment as completed in the projection.
 * Removes from `activeAssignmentIds` so availability filters exclude it.
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyScheduleCompleted(
  accountId: string,
  scheduleItemId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  const existing = await getDocument<AccountScheduleProjection>(
    `scheduleProjection/${accountId}`
  );

  if (aggregateVersion !== undefined) {
    if (
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
      })
    ) {
      return;
    }
  }

  const currentIndex = existing?.assignmentIndex ?? {};
  const existingAssignment = currentIndex[scheduleItemId];

  const updatedRecord: Omit<AccountScheduleProjection, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    accountId,
    activeAssignmentIds: (existing?.activeAssignmentIds ?? []).filter(
      (id) => id !== scheduleItemId
    ),
    assignmentIndex: {
      ...currentIndex,
      ...(existingAssignment
        ? { [scheduleItemId]: { ...existingAssignment, status: 'completed' } }
        : {}),
    },
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDocument(`scheduleProjection/${accountId}`, updatedRecord);
}
