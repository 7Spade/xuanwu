/**
 * Module: finance-strong-read.ts
 * Purpose: Provide finance-sensitive read snapshot through SK_READ_CONSISTENCY [S3].
 * Responsibilities: resolve read mode and return aggregate-grade finance balances.
 * Constraints: deterministic logic, respect module boundaries
 */

import { resolveReadConsistency } from '@/features/shared-kernel';

import type { FinanceStrongReadSnapshot } from '../_types';

import { executeFinanceStrongReadQuery } from './finance-aggregate-query-gateway';

interface FinanceStrongReadInput {
  readonly workspaceId: string;
  readonly receivedAmount: number;
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

  const aggregateSnapshot = await executeFinanceStrongReadQuery({
    workspaceId: input.workspaceId,
    receivedAmount: input.receivedAmount,
  });

  return {
    ...aggregateSnapshot,
    readConsistencyMode,
  };
}
