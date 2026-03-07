/**
 * @fileoverview Workspace Business — Finance Aggregate Repository.
 *
 * Stores and retrieves persisted finance aggregate state for a workspace.
 * Path: financeStates/{workspaceId}
 */

import { getDocument } from '../firestore.read.adapter';
import { setDocument } from '../firestore.write.adapter';
import { tagSlugRef, type TagSlugRef } from '@/shared-kernel';

type PersistedCostItemType =
  | 'EXECUTABLE'
  | 'MANAGEMENT'
  | 'RESOURCE'
  | 'FINANCIAL'
  | 'PROFIT'
  | 'ALLOWANCE';

interface PersistedFinanceDirectiveItem {
  id: string;
  name: string;
  sourceDocument: string;
  intentId: string;
  semanticTagSlug: TagSlugRef;
  costItemType: PersistedCostItemType;
  unitPrice: number;
  totalQuantity: number;
  remainingQuantity: number;
}

interface PersistedFinanceClaimLineItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface PersistedFinanceAggregateState {
  workspaceId: string;
  stage: string;
  cycleIndex: number;
  receivedAmount: number;
  directiveItems: PersistedFinanceDirectiveItem[];
  currentClaimLineItems: PersistedFinanceClaimLineItem[];
  paymentTermStartAtISO: string | null;
  paymentReceivedAtISO: string | null;
  updatedAt: number;
}

interface PersistedFinanceDirectiveItemInput
  extends Omit<PersistedFinanceDirectiveItem, 'semanticTagSlug'> {
  semanticTagSlug: string;
}

interface PersistedFinanceAggregateStateInput
  extends Omit<PersistedFinanceAggregateState, 'directiveItems'> {
  directiveItems: PersistedFinanceDirectiveItemInput[];
}

const financeAggregatePath = (workspaceId: string) => `financeStates/${workspaceId}`;

export async function getFinanceAggregateState(
  workspaceId: string,
): Promise<PersistedFinanceAggregateState | null> {
  return getDocument<PersistedFinanceAggregateState>(financeAggregatePath(workspaceId));
}

export async function saveFinanceAggregateState(
  state: PersistedFinanceAggregateStateInput,
): Promise<void> {
  const normalizedState: PersistedFinanceAggregateState = {
    ...state,
    directiveItems: state.directiveItems.map((item) => ({
      ...item,
      semanticTagSlug: tagSlugRef(item.semanticTagSlug),
    })),
  };

  await setDocument(financeAggregatePath(state.workspaceId), normalizedState);
}
