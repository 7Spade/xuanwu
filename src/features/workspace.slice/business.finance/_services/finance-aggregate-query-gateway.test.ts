/**
 * Module: finance-aggregate-query-gateway.test.ts
 * Purpose: Verify finance strong-read aggregate query semantics against parsing intents.
 * Responsibilities: ensure active-intent summation and outstanding balance invariants.
 * Constraints: deterministic logic, respect module boundaries
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParsingIntentsMock } = vi.hoisted(() => ({
  getParsingIntentsMock: vi.fn(),
}));

vi.mock('@/shared-infra/frontend-firebase/firestore/firestore.facade', () => ({
  getParsingIntents: getParsingIntentsMock,
}));

import { executeFinanceStrongReadQuery } from './finance-aggregate-query-gateway';

describe('finance-aggregate-query-gateway', () => {
  beforeEach(() => {
    getParsingIntentsMock.mockReset();
  });

  it('sums only active parsing intents and excludes superseded intents', async () => {
    getParsingIntentsMock.mockResolvedValue([
      {
        status: 'imported',
        lineItems: [{ subtotal: 120 }, { subtotal: 80 }],
      },
      {
        status: 'pending',
        lineItems: [{ subtotal: 100 }],
      },
      {
        status: 'superseded',
        lineItems: [{ subtotal: 999 }],
      },
    ]);

    const snapshot = await executeFinanceStrongReadQuery({
      workspaceId: 'ws-1',
      receivedAmount: 50,
    });

    expect(snapshot.totalClaimableAmount).toBe(300);
    expect(snapshot.receivedAmount).toBe(50);
    expect(snapshot.outstandingClaimableAmount).toBe(250);
    expect(snapshot.readConsistencyMode).toBe('STRONG_READ');
    expect(snapshot.source).toBe('aggregate');
  });

  it('keeps outstanding amount non-negative and normalizes invalid subtotals', async () => {
    getParsingIntentsMock.mockResolvedValue([
      {
        status: 'failed',
        lineItems: [{ subtotal: Number.NaN }, { subtotal: undefined }],
      },
    ]);

    const snapshot = await executeFinanceStrongReadQuery({
      workspaceId: 'ws-2',
      receivedAmount: 99,
    });

    expect(snapshot.totalClaimableAmount).toBe(0);
    expect(snapshot.receivedAmount).toBe(99);
    expect(snapshot.outstandingClaimableAmount).toBe(0);
  });
});
