/**
 * projection-bus/account-schedule — _queries.ts
 *
 * Read-side queries for the account schedule projection.
 * Used by scheduling.slice to filter available accounts.
 *
 * [T5] TAG_SNAPSHOT consumers MUST NOT write — these are read-only queries.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projector';

/**
 * Returns the full schedule projection for an account, or null if not initialised.
 */
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null> {
  return getDocument<AccountScheduleProjection>(`scheduleProjection/${accountId}`);
}

/**
 * Returns active (non-completed) assignments for an account.
 * Used by scheduling.slice to check availability before assigning.
 */
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]> {
  const projection = await getAccountScheduleProjection(accountId);
  if (!projection) return [];
  return Object.values(projection.assignmentIndex).filter((a) => a.status !== 'completed');
}
