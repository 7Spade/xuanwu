/**
 * Module: _types.ts
 * Purpose: Define finance lifecycle and claim drafting domain types.
 * Responsibilities: type contracts for finance UI, state machine, and read snapshot.
 * Constraints: deterministic logic, respect module boundaries
 */

import type { CostItemTypeValue } from '@/features/semantic-graph.slice';
import type { ReadConsistencyMode } from '@/features/shared-kernel';

export type FinanceLifecycleStage =
  | 'claim-preparation'
  | 'claim-submitted'
  | 'claim-approved'
  | 'invoice-requested'
  | 'payment-term'
  | 'payment-received'
  | 'completed';

export interface FinanceDirectiveItem {
  readonly id: string;
  readonly name: string;
  readonly sourceDocument: string;
  readonly intentId: string;
  readonly semanticTagSlug: string;
  readonly costItemType: CostItemTypeValue;
  readonly unitPrice: number;
  readonly totalQuantity: number;
  readonly remainingQuantity: number;
}

export interface FinanceClaimDraftEntry {
  readonly selected: boolean;
  readonly quantity: number;
}

export interface FinanceClaimLineItem {
  readonly itemId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineAmount: number;
}

export interface FinanceStrongReadSnapshot {
  readonly readConsistencyMode: ReadConsistencyMode;
  readonly source: 'aggregate';
  readonly totalClaimableAmount: number;
  readonly receivedAmount: number;
  readonly outstandingClaimableAmount: number;
}
