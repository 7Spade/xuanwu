/**
 * projection.schedule-timeline-view — _queries.ts
 *
 * Read-side queries for the per-member schedule timeline view.
 * Per 00-LogicOverview.md (VS6 → STD_PROJ_LANE):
 *   QGWAY_TL["→ .schedule-timeline-view\n資源維度（overlap/grouping 已預計算）"]
 *
 * Overlap and resource-grouping are pre-computed by the projector [L5]; callers
 * receive the ready-to-render blocks without any additional computation.
 *
 * [S4] PROJ_STALE_STANDARD ≤10s — standard projection staleness budget.
 * UI must read via L6 Query Gateway; direct Firebase access is prohibited [D5].
 */

import { db } from '@/shared-infra/frontend-firebase';
import {
  getDocs,
  collection,
  type QueryDocumentSnapshot,
} from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type { ScheduleTimelineMemberView } from './_projector';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the timeline document for a specific member within an org.
 * Contains pre-computed overlapGroup values for every block.
 *
 * Returns null if no events have been projected for that member yet.
 */
export async function getScheduleTimelineForMember(
  orgId: string,
  memberId: string
): Promise<ScheduleTimelineMemberView | null> {
  return getDocument<ScheduleTimelineMemberView>(
    `scheduleTimelineView/${orgId}/members/${memberId}`
  );
}

/**
 * Returns timeline documents for all members in a given org.
 * Used by the resource timeline grid to render the full org view.
 */
export async function getAllScheduleTimelines(
  orgId: string
): Promise<ScheduleTimelineMemberView[]> {
  const snap = await getDocs(collection(db, `scheduleTimelineView/${orgId}/members`));
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as ScheduleTimelineMemberView);
}
