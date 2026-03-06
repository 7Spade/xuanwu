'use server';

/**
 * Module: _actions/timeline.ts
 * Purpose: Timeline-specific schedule item mutations for workforce-scheduling.
 * Responsibilities: handle drag-to-reschedule date-range updates from TimelineView.
 * Constraints: [D3] all writes through facade; no direct Firestore SDK calls.
 */

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
import { setScheduleItemDateRange } from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';

/**
 * Updates the date range of a schedule item (TimelineView drag-to-reschedule).
 * [D3] Write routed through firestore.facade.
 */
export async function updateTimelineItemDateRange(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date,
): Promise<CommandResult> {
  try {
    await setScheduleItemDateRange(
      accountId,
      itemId,
      Timestamp.fromDate(startDate),
      Timestamp.fromDate(endDate),
    );
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'UPDATE_TIMELINE_ITEM_DATE_RANGE_FAILED',
      error instanceof Error ? error.message : 'Failed to update timeline item date range',
    );
  }
}
