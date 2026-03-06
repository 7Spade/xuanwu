'use server';

/**
 * Module: lifecycle.ts
 * Purpose: Schedule lifecycle/status mutations.
 * Responsibilities: approve, status update, date-range update
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
import {
  assignMemberAndApprove,
  setScheduleItemDateRange,
  setScheduleItemStatus,
} from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';

export async function approveScheduleItemWithMember(
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await assignMemberAndApprove(organizationId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'APPROVE_SCHEDULE_ITEM_FAILED',
      error instanceof Error ? error.message : 'Failed to approve schedule item'
    );
  }
}

export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<CommandResult> {
  try {
    await setScheduleItemStatus(organizationId, itemId, newStatus);
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'UPDATE_SCHEDULE_ITEM_STATUS_FAILED',
      error instanceof Error ? error.message : 'Failed to update schedule item status'
    );
  }
}

export async function updateScheduleItemDateRange(
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
      'UPDATE_SCHEDULE_ITEM_DATE_RANGE_FAILED',
      error instanceof Error ? error.message : 'Failed to update schedule item date range'
    );
  }
}
