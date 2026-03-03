/**
 * account-user.profile — _queries.ts
 *
 * Read queries for user profile data.
 *
 * Per slice standard: reads live in _queries.ts; mutations live in _actions.ts.
 */

import {
  getUserProfile as getUserProfileFacade,
} from "@/shared/infra/firestore/firestore.facade"
import { subscribeToDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account } from "@/shared/types"

/**
 * Fetches the user account/profile document by userId.
 */
export async function getUserProfile(userId: string): Promise<Account | null> {
  return getUserProfileFacade(userId)
}

/**
 * Opens a real-time listener for a user's account/profile document.
 * Returns an unsubscribe function.
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: Account | null) => void,
): () => void {
  return subscribeToDocument<Account>(`accounts/${userId}`, onUpdate)
}
