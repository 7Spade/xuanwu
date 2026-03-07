/**
 * projection-bus/wallet-balance — _queries.ts
 *
 * Read-side queries for the wallet balance projection.
 *
 * [D5] Display reads use this projection (EVENTUAL_READ).
 *       Transactional / exact-balance reads MUST use STRONG_READ back to WALLET_AGG.
 * [S3] SK_READ_CONSISTENCY: EVENTUAL_READ (display) vs STRONG_READ (transactions).
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type { WalletBalanceView } from './_projector';

/**
 * Returns the wallet balance view for an account, or null if not initialised.
 *
 * [D5] Display-only — for financial transactions use STRONG_READ path.
 */
export async function getWalletBalanceView(
  accountId: string
): Promise<WalletBalanceView | null> {
  return getDocument<WalletBalanceView>(`walletBalanceView/${accountId}`);
}

/**
 * Returns the display balance for an account.
 * Falls back to 0 if no projection record exists.
 *
 * [D5] EVENTUAL_READ path — use for display only.
 *       For exact balance in financial operations, use STRONG_READ on the Account aggregate.
 */
export async function getDisplayWalletBalance(accountId: string): Promise<number> {
  const view = await getWalletBalanceView(accountId);
  return view?.balance ?? 0;
}
