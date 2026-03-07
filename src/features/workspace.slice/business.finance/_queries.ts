import {
  getFinanceAggregateState as getFinanceAggregateStateFacade,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';

import type { FinanceAggregateState } from './_types';

export async function getFinanceAggregateState(
  workspaceId: string,
): Promise<FinanceAggregateState | null> {
  return getFinanceAggregateStateFacade(workspaceId) as Promise<FinanceAggregateState | null>;
}
