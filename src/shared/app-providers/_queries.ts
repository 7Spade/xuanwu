/**
 * @fileoverview shared/app-providers/_queries.ts
 *
 * Subscription factories for shared app-level providers.
 * All Firestore / infra imports are encapsulated here so that
 * `app-context.tsx` (and any future app-level provider) has zero direct
 * Firebase SDK or infra imports — satisfying D24 and D5.
 *
 * Pattern mirrors `workspace.slice/core/_queries.ts`.
 */

import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  onSnapshot,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type { Account } from '@/shared/types';

/**
 * Opens a real-time listener on accounts where `memberIds` contains `userId`.
 * Calls `onUpdate` with a parsed `Record<string, Account>` on every change.
 */
export function subscribeToAccountsForUser(
  userId: string,
  onUpdate: (accounts: Record<string, Account>) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'accounts'),
    where('memberIds', 'array-contains', userId),
  );
  return onSnapshot(q, (snap) => onUpdate(snapshotToRecord<Account>(snap)));
}
