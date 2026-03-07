/**
 * Module: app-provider.queries.ts
 * Purpose: firestore subscription factories for app-provider
 * Responsibilities: provide app-level account subscriptions without UI coupling
 * Constraints: deterministic logic, respect module boundaries
 */

import type { Account } from '@/shared-kernel'
import { db } from '@/shared/infra/firestore/firestore.client'
import {
  collection,
  onSnapshot,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter'
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils'

export function subscribeToAccountsForUser(
  userId: string,
  onUpdate: (accounts: Record<string, Account>) => void,
): Unsubscribe {
  const accountQuery = query(
    collection(db, 'accounts'),
    where('memberIds', 'array-contains', userId),
  )

  return onSnapshot(accountQuery, (snap) => onUpdate(snapshotToRecord<Account>(snap)))
}
