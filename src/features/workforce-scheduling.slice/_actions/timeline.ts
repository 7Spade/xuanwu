'use server';

/**
 * Module: timeline.ts
 * Purpose: Server actions for timeline workflows under workforce-scheduling.slice.
 * Responsibilities: timeline-specific schedule item mutations.
 * Constraints: deterministic logic, respect module boundaries
 */

import { updateScheduleItemDateRangeThroughGateway } from '@/shared-infra/gateway-command';
import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';

export async function updateTimelineItemDateRange(
  accountId: string,
  itemId: string,
  startDate: Date,
  endDate: Date
): Promise<CommandResult> {
  try {
    await updateScheduleItemDateRangeThroughGateway(accountId, itemId, startDate, endDate);
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'UPDATE_TIMELINE_ITEM_DATE_RANGE_FAILED',
      error instanceof Error ? error.message : 'Failed to update timeline item date range'
    );
  }
}
