/**
 * @fileoverview workspace-business.daily — Read-only queries.
 * @description Server-side read functions for fetching daily log entries.
 * Callable from RSC pages, hooks, and context without React dependencies.
 *
 * Per 00-LogicOverview.md [R4]: read queries must NOT live in _actions.ts.
 */

import { db } from '@/shared-infra/frontend-firebase';
import { getDailyLogs as getDailyLogsFacade } from "@/shared/infra/firestore/firestore.facade";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "@/shared/infra/firestore/firestore.read.adapter";

import type { DailyLog, DailyLogComment } from "./_types";

/**
 * Fetches daily log entries for an account.
 * @param accountId The ID of the organization account.
 * @param limit Maximum number of logs to return (default: 30).
 */
export async function getDailyLogs(
  accountId: string,
  limit = 30
): Promise<DailyLog[]> {
  return getDailyLogsFacade(accountId, limit);
}

/**
 * Opens a real-time listener on the comments subcollection of a daily log.
 * Calls `onUpdate` with the latest comment array on every change.
 */
export function subscribeToDailyLogComments(
  accountId: string,
  logId: string,
  onUpdate: (comments: DailyLogComment[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, `accounts/${accountId}/dailyLogs/${logId}/comments`),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }) as DailyLogComment);
    onUpdate(comments);
  });
}

/**
 * Opens a real-time listener on a user's bookmarks subcollection.
 * Calls `onUpdate` with a Set of bookmarked log IDs on every change.
 * Calls `onError` on subscription errors.
 */
export function subscribeToBookmarks(
  userId: string,
  onUpdate: (bookmarkedIds: Set<string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, `accounts/${userId}/bookmarks`));
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(new Set(snapshot.docs.map((doc) => doc.id)));
    },
    onError,
  );
}
