/**
 * projection.schedule-calendar-view — _queries.ts
 *
 * Read-side queries for the schedule calendar day view.
 * Per 00-LogicOverview.md (VS6 → STD_PROJ_LANE):
 *   QGWAY_CAL["→ .schedule-calendar-view\n日期維度（UI 禁止直讀 VS6/Firebase）"]
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

import type { ScheduleCalendarDayView } from './_projector';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the calendar-day document for a given org + date key.
 * Returns null if no events have been projected for that day yet.
 *
 * dateKey format: YYYY-MM-DD
 */
export async function getScheduleCalendarDay(
  orgId: string,
  dateKey: string
): Promise<ScheduleCalendarDayView | null> {
  return getDocument<ScheduleCalendarDayView>(
    `scheduleCalendarView/${orgId}/days/${dateKey}`
  );
}

/**
 * Returns all calendar-day documents for a given org.
 * Used by the calendar month/week grid to load an entire org's schedule.
 *
 * Consumers should filter / slice the returned array to the visible
 * date window on the client side.
 */
export async function getAllScheduleCalendarDays(
  orgId: string
): Promise<ScheduleCalendarDayView[]> {
  const snap = await getDocs(collection(db, `scheduleCalendarView/${orgId}/days`));
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as ScheduleCalendarDayView);
}
