/**
 * projection.schedule-calendar-view — _projector.ts
 *
 * Maintains the per-org/per-day calendar-dimension read model for schedule items.
 *
 * Per 00-LogicOverview.md (VS6 → STD_PROJ_LANE):
 *   CAL_PROJ["projection.schedule-calendar-view\n日期維度 Read Model [L5-Bus]\napplyVersionGuard() [S2]"]
 *   QGWAY_CAL["→ .schedule-calendar-view\n日期維度（UI 禁止直讀 VS6/Firebase）"]
 *
 * Stored at: scheduleCalendarView/{orgId}/days/{dateKey}
 *   dateKey format: YYYY-MM-DD
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 * [D14] Schedule reads only ORG_ELIGIBLE_MEMBER_VIEW snapshot; membership
 *        concerns stay in VS6, this projector only maintains the date-keyed read model.
 *
 * Feed path: IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE → here.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import {
  setDocument,
  serverTimestamp,
} from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';
import type { ScheduleItem } from '@/shared-kernel';

// ---------------------------------------------------------------------------
// Read model shape
// ---------------------------------------------------------------------------

/** A lightweight slot entry stored inside a calendar-day document. */
export interface CalendarSlot {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly title: string;
  /** ISO-8601 timestamp string derived from ScheduleItem.startDate */
  readonly startAt: string;
  /** ISO-8601 timestamp string derived from ScheduleItem.endDate */
  readonly endAt: string;
  readonly status: ScheduleItem['status'];
  readonly assigneeIds: string[];
  /** Last aggregate version processed [S2] */
  lastProcessedVersion: number;
}

/**
 * Per-day calendar view.
 * Document key: scheduleCalendarView/{orgId}/days/{dateKey}
 */
export interface ScheduleCalendarDayView {
  readonly orgId: string;
  /** YYYY-MM-DD */
  readonly dateKey: string;
  /** Map of scheduleItemId → slot */
  slots: Record<string, CalendarSlot>;
  /** Monotonically increasing projection version for this day [S2] */
  lastProcessedVersion: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Firestore path for a calendar-day document. */
function calendarDayPath(orgId: string, dateKey: string): string {
  return `scheduleCalendarView/${orgId}/days/${dateKey}`;
}

/**
 * Derives a YYYY-MM-DD string from a Firestore Timestamp-compatible value.
 * Accepts objects with `.toDate()` (Firestore Timestamp), Date, or ISO string.
 */
function toDateKey(value: { toDate?: () => Date } | Date | string): string {
  let date: Date;
  if (typeof value === 'string') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value.toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate();
  } else {
    date = new Date();
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Projector functions (called by Event Funnel)
// ---------------------------------------------------------------------------

/**
 * Upserts a slot for a newly proposed or updated schedule item into the
 * calendar-day document for its start date.
 *
 * [S2] Skips if the incoming aggregateVersion is not newer than the slot's
 *       lastProcessedVersion.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyScheduleCalendarUpsert(params: {
  orgId: string;
  scheduleItem: Pick<
    ScheduleItem,
    | 'id'
    | 'workspaceId'
    | 'title'
    | 'startDate'
    | 'endDate'
    | 'status'
    | 'assigneeIds'
    | 'version'
  >;
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { orgId, scheduleItem, aggregateVersion, traceId } = params;
  const dateKey = toDateKey(scheduleItem.startDate as Parameters<typeof toDateKey>[0]);
  const docPath = calendarDayPath(orgId, dateKey);

  const existing = await getDocument<ScheduleCalendarDayView>(docPath);
  const currentSlot = existing?.slots?.[scheduleItem.id];

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: currentSlot?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }

  const updatedSlots: Record<string, CalendarSlot> = {
    ...(existing?.slots ?? {}),
    [scheduleItem.id]: {
      scheduleItemId: scheduleItem.id,
      workspaceId: scheduleItem.workspaceId,
      title: scheduleItem.title,
      startAt: scheduleItem.startDate instanceof Date
        ? scheduleItem.startDate.toISOString()
        : String(scheduleItem.startDate),
      endAt: scheduleItem.endDate instanceof Date
        ? scheduleItem.endDate.toISOString()
        : String(scheduleItem.endDate),
      status: scheduleItem.status,
      assigneeIds: scheduleItem.assigneeIds,
      lastProcessedVersion: aggregateVersion,
    },
  };

  const view: Omit<ScheduleCalendarDayView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    orgId,
    dateKey,
    slots: updatedSlots,
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(docPath, view);
}

/**
 * Removes a slot from the calendar-day document when a schedule item is
 * cancelled, rejected, or completed and should no longer appear on the board.
 *
 * [S2] Uses the existing slot's lastProcessedVersion as the floor; only removes
 *       if the incoming version is strictly newer.
 * [R8] traceId forwarded.
 */
export async function applyScheduleCalendarRemove(params: {
  orgId: string;
  scheduleItemId: string;
  dateKey: string;
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { orgId, scheduleItemId, dateKey, aggregateVersion, traceId } = params;
  const docPath = calendarDayPath(orgId, dateKey);

  const existing = await getDocument<ScheduleCalendarDayView>(docPath);
  if (!existing) return;

  const currentSlot = existing.slots?.[scheduleItemId];
  if (!currentSlot) return;

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: currentSlot.lastProcessedVersion,
    })
  ) {
    return;
  }

  const { [scheduleItemId]: _removed, ...remainingSlots } = existing.slots;

  const view: Omit<ScheduleCalendarDayView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    ...existing,
    slots: remainingSlots,
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(docPath, view);
}
