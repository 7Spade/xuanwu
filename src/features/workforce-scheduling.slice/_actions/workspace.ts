'use server';

/**
 * Module: workspace.ts
 * Purpose: Workspace-level schedule mutations.
 * Responsibilities: create item, assign member, unassign member
 * Constraints: deterministic logic, respect module boundaries
 */

import { addDays, isSameDay, startOfDay } from 'date-fns';

import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';
import type { ScheduleItem } from '@/shared-kernel';
import {
  assignMemberToScheduleItem,
  saveScheduleItem,
  unassignMemberFromScheduleItem,
} from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';

function isStartOfDay(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

function resolveTemporalRange(
  startInput?: Date | null,
  endInput?: Date | null,
  now = new Date()
): {
  temporalKind: NonNullable<ScheduleItem['temporalKind']>;
  startDate: Date;
  endDate: Date;
} {
  const hasStart = Boolean(startInput);
  const hasEnd = Boolean(endInput);

  if (!hasStart && !hasEnd) {
    return {
      temporalKind: 'point',
      startDate: now,
      endDate: now,
    };
  }

  if (hasStart && !hasEnd) {
    return {
      temporalKind: 'point',
      startDate: startInput!,
      endDate: startInput!,
    };
  }

  if (!hasStart && hasEnd) {
    return {
      temporalKind: 'point',
      startDate: endInput!,
      endDate: endInput!,
    };
  }

  const startValue = startInput!;
  const endValue = endInput!;
  const [rawStart, rawEnd] = endValue.getTime() < startValue.getTime()
    ? [endValue, startValue]
    : [startValue, endValue];

  const sameInstant = rawStart.getTime() === rawEnd.getTime();
  const allDayCandidate = isSameDay(rawStart, rawEnd) && isStartOfDay(rawStart) && isStartOfDay(rawEnd);

  if (sameInstant || allDayCandidate) {
    const normalizedStart = startOfDay(rawStart);
    return {
      temporalKind: 'allDay',
      startDate: normalizedStart,
      endDate: addDays(normalizedStart, 1),
    };
  }

  return {
    temporalKind: 'range',
    startDate: rawStart,
    endDate: rawEnd,
  };
}

export async function createScheduleItem(
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<CommandResult> {
  try {
    const resolved = resolveTemporalRange(itemData.startDate, itemData.endDate);
    const data: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'> = {
      ...itemData,
      temporalKind: resolved.temporalKind,
      startDate: Timestamp.fromDate(resolved.startDate),
      endDate: Timestamp.fromDate(resolved.endDate),
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
