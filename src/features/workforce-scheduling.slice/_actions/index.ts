/**
 * Module: index.ts
 * Purpose: Server actions for workforce-scheduling.slice.
 * Responsibilities: expose unified schedule/timeline command entry points.
 * Constraints: deterministic logic, respect module boundaries
 */

export {
  createScheduleItem,
  assignMember,
  unassignMember,
} from './workspace';

export {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
  updateScheduleItemDateRange,
} from './lifecycle';

export {
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  completeOrgScheduleAction,
} from './governance';

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
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
