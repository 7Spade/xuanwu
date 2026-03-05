'use server';

/**
 * Module: _actions.workspace.ts
 * Purpose: Workspace-level schedule mutations.
 * Responsibilities: create item, assign member, unassign member
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import {
  assignMemberToScheduleItem,
  saveScheduleItem,
  unassignMemberFromScheduleItem,
} from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';

export async function createScheduleItem(
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<CommandResult> {
  try {
    const now = Timestamp.now();
    const data: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'> = {
      ...itemData,
      startDate: itemData.startDate ? Timestamp.fromDate(itemData.startDate) : now,
      endDate: itemData.endDate ? Timestamp.fromDate(itemData.endDate) : now,
    };
    const id = await saveScheduleItem(data);
    return commandSuccess(id, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'CREATE_SCHEDULE_ITEM_FAILED',
      error instanceof Error ? error.message : 'Failed to create schedule item'
    );
  }
}

export async function assignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await assignMemberToScheduleItem(accountId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'ASSIGN_MEMBER_TO_SCHEDULE_FAILED',
      error instanceof Error ? error.message : 'Failed to assign member to schedule item'
    );
  }
}

export async function unassignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await unassignMemberFromScheduleItem(accountId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (error) {
    return commandFailureFrom(
      'UNASSIGN_MEMBER_FROM_SCHEDULE_FAILED',
      error instanceof Error ? error.message : 'Failed to unassign member from schedule item'
    );
  }
}
