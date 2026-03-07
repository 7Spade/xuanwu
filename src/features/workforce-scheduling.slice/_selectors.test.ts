/**
 * @fileoverview Tests for workforce-scheduling.slice pure selectors [D8]
 *
 * These selectors have zero I/O and no React dependency ??every test is
 * synchronous and runs without mocking Firebase or React contexts.
 *
 * Tests cover:
 *   1. selectAllScheduleItems ??workspace name resolution, unknown workspace fallback
 *   2. selectPendingProposals ??status filter (PROPOSAL only)
 *   3. selectDecisionHistory ??last-7-days filter and descending sort
 *   4. selectUpcomingEvents ??future OFFICIAL items with members attached
 *   5. selectPresentEvents ??today's OFFICIAL items with members attached
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { ScheduleItem } from '@/shared-kernel';

import {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from './_selectors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal Timestamp-like object that mirrors the Firestore Timestamp contract. */
function makeTimestamp(date: Date) {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

const NOW = new Date('2025-06-15T12:00:00Z');
const YESTERDAY = new Date('2025-06-14T12:00:00Z');
const THREE_DAYS_AGO = new Date('2025-06-12T12:00:00Z');
const TEN_DAYS_AGO = new Date('2025-06-05T12:00:00Z');
const TOMORROW = new Date('2025-06-16T12:00:00Z');
const NEXT_WEEK = new Date('2025-06-22T12:00:00Z');

/** Typed base factory ??all required ScheduleItem fields are populated with safe defaults. */
function makeItem(overrides: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: 'item-1',
    accountId: 'org-1',
    workspaceId: 'ws-1',
    title: 'Test Event',
    status: 'PROPOSAL',
    originType: 'MANUAL',
    assigneeIds: [],
    createdAt: makeTimestamp(NOW),
    updatedAt: makeTimestamp(NOW),
    startDate: makeTimestamp(NOW),
    endDate: makeTimestamp(TOMORROW),
    ...overrides,
  } as ScheduleItem;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('selectAllScheduleItems', () => {
  it('resolves workspaceName from workspaces map', () => {
    const items = { 'item-1': makeItem({ workspaceId: 'ws-1' }) };
    const workspaces = { 'ws-1': { name: 'Alpha Workspace' } };

     
    const result = selectAllScheduleItems(items, workspaces);

    expect(result).toHaveLength(1);
    expect(result[0].workspaceName).toBe('Alpha Workspace');
  });

  it('falls back to "Unknown Workspace" when workspace id is not found', () => {
    const items = { 'item-1': makeItem({ workspaceId: 'ws-missing' }) };
    const workspaces = {};

     
    const result = selectAllScheduleItems(items, workspaces);

    expect(result[0].workspaceName).toBe('Unknown Workspace');
  });

  it('returns empty array for empty schedule_items', () => {
     
    const result = selectAllScheduleItems({}, {});
    expect(result).toHaveLength(0);
  });
});

describe('selectPendingProposals', () => {
  it('returns only PROPOSAL items', () => {
    const items = [
      { ...makeItem({ id: 'a', status: 'PROPOSAL' }), workspaceName: 'WS' },
      { ...makeItem({ id: 'b', status: 'OFFICIAL' }), workspaceName: 'WS' },
      { ...makeItem({ id: 'c', status: 'REJECTED' }), workspaceName: 'WS' },
    ];

     
    const result = selectPendingProposals(items);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('returns empty array when no PROPOSAL items exist', () => {
    const items = [
      { ...makeItem({ id: 'b', status: 'OFFICIAL' }), workspaceName: 'WS' },
    ];
     
    expect(selectPendingProposals(items)).toHaveLength(0);
  });
});

describe('selectDecisionHistory', () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW }));
  afterEach(() => vi.useRealTimers());

  it('returns OFFICIAL and REJECTED items updated within the last 7 days', () => {
    const items = [
      {
        ...makeItem({ id: 'recent-official', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        updatedAt: makeTimestamp(YESTERDAY),
      },
      {
        ...makeItem({ id: 'old-official', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        updatedAt: makeTimestamp(TEN_DAYS_AGO),
      },
      {
        ...makeItem({ id: 'recent-rejected', status: 'REJECTED' }),
        workspaceName: 'WS',
        updatedAt: makeTimestamp(THREE_DAYS_AGO),
      },
      {
        ...makeItem({ id: 'proposal', status: 'PROPOSAL' }),
        workspaceName: 'WS',
        updatedAt: makeTimestamp(YESTERDAY),
      },
    ];

     
    const result = selectDecisionHistory(items);

    expect(result.map((i) => i.id)).toEqual(['recent-official', 'recent-rejected']);
  });

  it('sorts descending by updatedAt', () => {
    const items = [
      {
        ...makeItem({ id: 'older', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        updatedAt: makeTimestamp(THREE_DAYS_AGO),
      },
      {
        ...makeItem({ id: 'newer', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        updatedAt: makeTimestamp(YESTERDAY),
      },
    ];
     
    const result = selectDecisionHistory(items);
    expect(result[0].id).toBe('newer');
  });
});

describe('selectUpcomingEvents', () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW }));
  afterEach(() => vi.useRealTimers());

  const members = [{ id: 'u1', name: 'Alice' }];

  it('returns OFFICIAL items with a future startDate', () => {
    const items = [
      {
        ...makeItem({ id: 'future', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(TOMORROW),
      },
      {
        ...makeItem({ id: 'past', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(YESTERDAY),
      },
      {
        ...makeItem({ id: 'proposal', status: 'PROPOSAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(TOMORROW),
      },
    ];

     
    const result = selectUpcomingEvents(items, members);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('future');
    expect(result[0].members).toBe(members);
  });

  it('sorts ascending by startDate', () => {
    const items = [
      {
        ...makeItem({ id: 'later', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(NEXT_WEEK),
      },
      {
        ...makeItem({ id: 'sooner', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(TOMORROW),
      },
    ];
     
    const result = selectUpcomingEvents(items, members);
    expect(result[0].id).toBe('sooner');
  });
});

describe('selectPresentEvents', () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW })); // NOW = 2025-06-15 noon
  afterEach(() => vi.useRealTimers());

  const members = [{ id: 'u1', name: 'Alice' }];

  it('returns OFFICIAL items spanning today', () => {
    // Event that started yesterday and ends today ??currently in progress
    const START = new Date('2025-06-14T08:00:00Z');
    const END = new Date('2025-06-15T18:00:00Z');

    const items = [
      {
        ...makeItem({ id: 'ongoing', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(START),
        endDate: makeTimestamp(END),
      },
      {
        ...makeItem({ id: 'future', status: 'OFFICIAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(TOMORROW),
        endDate: makeTimestamp(NEXT_WEEK),
      },
    ];

     
    const result = selectPresentEvents(items, members);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ongoing');
    expect(result[0].members).toBe(members);
  });

  it('excludes PROPOSAL items even if spanning today', () => {
    const items = [
      {
        ...makeItem({ id: 'proposal', status: 'PROPOSAL' }),
        workspaceName: 'WS',
        startDate: makeTimestamp(YESTERDAY),
        endDate: makeTimestamp(TOMORROW),
      },
    ];
     
    expect(selectPresentEvents(items, members)).toHaveLength(0);
  });
});
