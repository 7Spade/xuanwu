/**
 * projection-bus/account-view — queries.ts
 *
 * Read-side queries for the account projection view.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import type { AuthoritySnapshot } from '@/shared-kernel';

import type { AccountViewRecord } from './_projector';

export async function getAccountView(accountId: string): Promise<AccountViewRecord | null> {
  return getDocument<AccountViewRecord>(`accountView/${accountId}`);
}

/**
 * Returns the latest authority snapshot for an account.
 * Used by notification content filtering (Layer 3).
 */
export async function getAccountAuthoritySnapshot(
  accountId: string
): Promise<AuthoritySnapshot | null> {
  const view = await getAccountView(accountId);
  return view?.authoritySnapshot ?? null;
}

/**
 * Returns the membership tag ('internal' | 'external') for notification filtering.
 */
export async function getAccountMembershipTag(
  accountId: string
): Promise<'internal' | 'external' | null> {
  const view = await getAccountView(accountId);
  return view?.membershipTag ?? null;
}
