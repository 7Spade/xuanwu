/**
 * scheduling.slice/_projectors — account-schedule-queries.ts
 *
 * Read-side queries for the account schedule projection.
 * Used by scheduling.slice to filter available accounts.
 */

import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountScheduleProjection, AccountScheduleAssignment } from './account-schedule';

export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null> {
  return getDocument<AccountScheduleProjection>(`scheduleProjection/${accountId}`);
}

/**
 * Returns active assignments for an account.
 * Used by scheduling.slice to check availability.
 */
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]> {
  const projection = await getAccountScheduleProjection(accountId);
  if (!projection) return [];
  return Object.values(projection.assignmentIndex).filter(
    (a) => a.status !== 'completed'
  );
}
