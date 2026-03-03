import { describe, expect, it, vi } from 'vitest';

import type { ScheduleItem } from '@/features/shared-kernel';

import {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from './_selectors';

interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}

function makeTimestamp(input: string): TimestampLike {
  const date = new Date(input);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

function makeScheduleItem(overrides: Partial<ScheduleItem>): ScheduleItem {
  const now = makeTimestamp('2026-03-01T00:00:00.000Z');
  return {
    id: 'item-1',
    accountId: 'org-1',
    workspaceId: 'ws-1',
    title: 'item',
    createdAt: now,
    startDate: now,
    endDate: now,
    status: 'PROPOSAL',
    originType: 'MANUAL',
    assigneeIds: [],
    ...overrides,
  };
}

describe('scheduling selectors', () => {
  it('selectAllScheduleItems adds workspaceName fallback', () => {
    const scheduleItems = {
      a: makeScheduleItem({ id: 'a', workspaceId: 'ws-known' }),
      b: makeScheduleItem({ id: 'b', workspaceId: 'ws-unknown' }),
    };
    const workspaces = {
      'ws-known': { name: 'Known Workspace' },
    };

    const result = selectAllScheduleItems(scheduleItems, workspaces);
    expect(result.find((item) => item.id === 'a')?.workspaceName).toBe('Known Workspace');
    expect(result.find((item) => item.id === 'b')?.workspaceName).toBe('Unknown Workspace');
  });

  it('selectDecisionHistory keeps only recent OFFICIAL/REJECTED and sorts desc by updatedAt', () => {
    const now = new Date('2026-03-10T00:00:00.000Z');
    const items = [
      makeScheduleItem({
        id: 'official-recent',
        status: 'OFFICIAL',
        updatedAt: makeTimestamp('2026-03-09T00:00:00.000Z'),
      }),
      makeScheduleItem({
        id: 'rejected-recent',
        status: 'REJECTED',
        updatedAt: makeTimestamp('2026-03-08T00:00:00.000Z'),
      }),
      makeScheduleItem({
        id: 'official-old',
        status: 'OFFICIAL',
        updatedAt: makeTimestamp('2026-02-20T00:00:00.000Z'),
      }),
      makeScheduleItem({
        id: 'proposal-recent',
        status: 'PROPOSAL',
        updatedAt: makeTimestamp('2026-03-09T00:00:00.000Z'),
      }),
    ];

    const result = selectDecisionHistory(items, now);
    expect(result.map((item) => item.id)).toEqual(['official-recent', 'rejected-recent']);
  });

  it('selectUpcomingEvents and selectPresentEvents classify OFFICIAL events by time window', () => {
    const now = new Date('2026-03-10T09:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const items = [
      makeScheduleItem({
        id: 'upcoming',
        status: 'OFFICIAL',
        startDate: makeTimestamp('2026-03-11T10:00:00.000Z'),
        endDate: makeTimestamp('2026-03-11T18:00:00.000Z'),
      }),
      makeScheduleItem({
        id: 'present',
        status: 'OFFICIAL',
        startDate: makeTimestamp('2026-03-10T08:00:00.000Z'),
        endDate: makeTimestamp('2026-03-10T17:00:00.000Z'),
      }),
      makeScheduleItem({
        id: 'proposal',
        status: 'PROPOSAL',
        startDate: makeTimestamp('2026-03-10T08:00:00.000Z'),
      }),
    ];
    const members = [{ id: 'm1' }];

    const upcoming = selectUpcomingEvents(items, members);
    const present = selectPresentEvents(items, members, now);

    expect(upcoming.map((item) => item.id)).toEqual(['upcoming']);
    expect(upcoming[0]?.members).toEqual(members);
    expect(present.map((item) => item.id)).toEqual(['present']);
    expect(present[0]?.members).toEqual(members);
    vi.useRealTimers();
  });

  it('selectPendingProposals keeps only PROPOSAL', () => {
    const items = [
      makeScheduleItem({ id: 'proposal', status: 'PROPOSAL' }),
      makeScheduleItem({ id: 'official', status: 'OFFICIAL' }),
    ];
    expect(selectPendingProposals(items).map((item) => item.id)).toEqual(['proposal']);
  });
});
