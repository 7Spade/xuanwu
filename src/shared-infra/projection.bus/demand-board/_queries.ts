/**
 * projection.demand-board — _queries.ts
 *
 * Read-side queries for the demand board schedule-item view.
 * Per docs/prd-schedule-workforce-skills.md FR-W0 / FR-W6 and
 * 00-LogicOverview.md (VS6 Demand Board read model):
 *
 *   PROPOSAL  — proposal submitted, awaiting assignment (visible)
 *   OFFICIAL  — member confirmed (visible with assignee details)
 *   REJECTED / COMPLETED — closed (hidden from default board view)
 *
 * Single source of truth: accounts/{orgId}/schedule_items/{scheduleItemId}
 *
 * [S4] PROJ_STALE_DEMAND_BOARD ≤5s (SK_STALENESS_CONTRACT).
 * UI must read via L6 Query Gateway; direct Firebase access is prohibited [D5].
 */

import { db } from '@/shared-infra/frontend-firebase';
import {
  getDocs,
  collection,
  query,
  where,
  orderBy,
  type QueryDocumentSnapshot,
} from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns a single demand-board schedule item by its composite key.
 * Returns null if the document has not yet been projected.
 */
export async function getDemandBoardItem(
  orgId: string,
  scheduleItemId: string
): Promise<ScheduleItem | null> {
  return getDocument<ScheduleItem>(
    `accounts/${orgId}/schedule_items/${scheduleItemId}`
  );
}

/**
 * Returns all open demand-board items for an org.
 * "Open" means status is PROPOSAL or OFFICIAL; REJECTED / COMPLETED are excluded.
 *
 * Results are ordered by createdAt descending (newest first).
 */
export async function getOpenDemandBoardItems(
  orgId: string
): Promise<ScheduleItem[]> {
  const ref = collection(db, `accounts/${orgId}/schedule_items`);
  const snap = await getDocs(
    query(
      ref,
      where('status', 'in', ['PROPOSAL', 'OFFICIAL'] satisfies ScheduleStatus[]),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d: QueryDocumentSnapshot) => ({
    ...(d.data() as Omit<ScheduleItem, 'id'>),
    id: d.id,
  }));
}

/**
 * Returns all demand-board items for an org with a specific status.
 * Use getOpenDemandBoardItems for the default board view (PROPOSAL + OFFICIAL).
 */
export async function getDemandBoardItemsByStatus(
  orgId: string,
  status: ScheduleStatus
): Promise<ScheduleItem[]> {
  const ref = collection(db, `accounts/${orgId}/schedule_items`);
  const snap = await getDocs(
    query(ref, where('status', '==', status), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d: QueryDocumentSnapshot) => ({
    ...(d.data() as Omit<ScheduleItem, 'id'>),
    id: d.id,
  }));
}
