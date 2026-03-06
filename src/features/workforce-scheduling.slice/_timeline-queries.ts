/**
 * Module: _queries.ts
 * Purpose: Query/subscription factories for timelineing.slice.
 * Responsibilities: timeline item subscriptions and timeline-safe mapping.
 * Constraints: deterministic logic, respect module boundaries
 */

import type { ScheduleItem } from '@/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';

function toScheduleItemSnapshot(doc: QueryDocumentSnapshot): ScheduleItem {
  return {
    ...(doc.data() as Omit<ScheduleItem, 'id'>),
    id: doc.id,
  };
}

export function subscribeToWorkspaceTimelineItems(
  accountId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'accounts', accountId, 'schedule_items'),
    where('workspaceId', '==', workspaceId),
    orderBy('startDate', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => onUpdate(snapshot.docs.map((doc) => toScheduleItemSnapshot(doc))),
    (error) => onError?.(error as Error)
  );
}
