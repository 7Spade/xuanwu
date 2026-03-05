/**
 * Module: finance-strong-read.ts
 * Purpose: Provide finance-sensitive read snapshot through SK_READ_CONSISTENCY [S3].
 * Responsibilities: resolve read mode and return aggregate-grade finance balances.
 * Constraints: deterministic logic, respect module boundaries
 */

import { resolveReadConsistency } from '@/features/shared-kernel';

import type { FinanceDirectiveItem, FinanceStrongReadSnapshot } from '../_types';

interface FinanceStrongReadInput {
  readonly directiveItems: readonly FinanceDirectiveItem[];
  readonly receivedAmount: number;
}

function computeOutstandingClaimableAmount(
  directiveItems: readonly FinanceDirectiveItem[],
  receivedAmount: number,
): Pick<FinanceStrongReadSnapshot, 'totalClaimableAmount' | 'outstandingClaimableAmount'> {
  const totalClaimableAmount = directiveItems.reduce(
    (total, item) => total + item.unitPrice * item.remainingQuantity,
    0,
  );

  return {
    totalClaimableAmount,
    outstandingClaimableAmount: Math.max(totalClaimableAmount, 0),
  };
}

export async function fetchFinanceStrongReadSnapshot(
  input: FinanceStrongReadInput,
): Promise<FinanceStrongReadSnapshot> {
  const readConsistencyMode = resolveReadConsistency({
    isFinancial: true,
    isSecurity: false,
    isIrreversible: true,
  });

  if (readConsistencyMode !== 'STRONG_READ') {
    throw new Error('[S3] Finance data must use STRONG_READ.');
  }

  const { totalClaimableAmount, outstandingClaimableAmount } = computeOutstandingClaimableAmount(
    input.directiveItems,
    input.receivedAmount,
  );

  return {
    readConsistencyMode,
    source: 'aggregate',
    totalClaimableAmount,
    receivedAmount: input.receivedAmount,
    outstandingClaimableAmount,
  };
}
