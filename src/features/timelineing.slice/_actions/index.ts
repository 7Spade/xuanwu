'use server';

/**
 * Module: index.ts
 * Purpose: Server actions for timelineing.slice.
 * Responsibilities: timeline-specific schedule item mutations.
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/features/shared-kernel';
import { setScheduleItemDateRange } from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';

export async function updateTimelineItemDateRange(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date
): Promise<CommandResult> {
  try {
    await setScheduleItemDateRange(
      accountId,
      itemId,
      Timestamp.fromDate(startDate),
      Timestamp.fromDate(endDate)
    );
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'UPDATE_TIMELINE_ITEM_DATE_RANGE_FAILED',
      error instanceof Error ? error.message : 'Failed to update timeline item date range'
    );
  }
}
