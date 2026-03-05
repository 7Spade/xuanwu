/**
 * Module: _constants.ts
 * Purpose: Finance lifecycle constants and non-task cost classification sets.
 * Responsibilities: provide immutable domain constants used by finance components.
 * Constraints: deterministic logic, respect module boundaries
 */

import { CostItemType } from '@/features/semantic-graph.slice';

import type { FinanceLifecycleStage } from './_types';
import type { CostItemTypeValue } from '@/features/semantic-graph.slice';

export const FINANCE_LIFECYCLE_STAGES: readonly FinanceLifecycleStage[] = [
  'claim-preparation',
  'claim-submitted',
  'claim-approved',
  'invoice-requested',
  'payment-term',
  'payment-received',
  'completed',
] as const;

export const NON_TASK_COST_ITEM_TYPES: ReadonlySet<CostItemTypeValue> = new Set<CostItemTypeValue>([
  CostItemType.MANAGEMENT,
  CostItemType.RESOURCE,
  CostItemType.FINANCIAL,
  CostItemType.PROFIT,
  CostItemType.ALLOWANCE,
]);
