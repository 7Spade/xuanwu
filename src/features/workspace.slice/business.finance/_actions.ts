import {
  saveFinanceAggregateState as saveFinanceAggregateStateFacade,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';

import type { FinanceAggregateState } from './_types';

export async function saveFinanceAggregateState(
  state: FinanceAggregateState,
): Promise<void> {
  await saveFinanceAggregateStateFacade(state);
}
