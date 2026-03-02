/**
 * projection.wallet-balance — _projector.ts
 *
 * Maintains the wallet balance projection read model.
 * Provides a cached EVENTUAL_READ view of account wallet balance
 * for display purposes.
 *
 * Stored at: walletBalanceView/{accountId}
 *
 * Per logic-overview.md (PROJ_BUS CRIT_PROJ):
 *   WALLET_V["projection.wallet-balance\n[S3: EVENTUAL_READ]\n顯示用・精確交易回源 AGG"]
 *   QGWAY_WALLET → projection.wallet-balance (STRONG_READ [Q8][D5])
 *
 * Read-consistency contract [S3]:
 *   - EVENTUAL_READ: this projection (display balance, refreshed on wallet events)
 *   - STRONG_READ: read directly from the Account aggregate (financial transactions)
 *
 * [S2] SK_VERSION_GUARD: aggregateVersion monotonic check before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 * [D5] Wallet balance display reads from this projection.
 *      Transactional operations MUST use STRONG_READ back to WALLET_AGG.
 */

import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';

import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';

export interface WalletBalanceView {
  /** Account identifier. */
  readonly accountId: string;
  /** Cached display balance (EVENTUAL_READ). For exact balance use STRONG_READ path. */
  balance: number;
  /** Running total credits (for display). */
  totalCredited: number;
  /** Running total debits (for display). */
  totalDebited: number;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

const COLLECTION = 'walletBalanceView';

/**
 * Initialises or resets the wallet balance projection for an account.
 * Called when a new account is created.
 */
export async function initWalletBalanceView(accountId: string): Promise<void> {
  await setDocument(`${COLLECTION}/${accountId}`, {
    accountId,
    balance: 0,
    totalCredited: 0,
    totalDebited: 0,
    readModelVersion: 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Applies a wallet credit event to the projection.
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyWalletCredited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  const existing = await getDocument<WalletBalanceView>(`${COLLECTION}/${accountId}`);

  if (aggregateVersion !== undefined) {
    if (
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
      })
    ) {
      return;
    }
  }

  const currentBalance = existing?.balance ?? 0;
  const currentTotalCredited = existing?.totalCredited ?? 0;

  const updated: Omit<WalletBalanceView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    accountId,
    balance: currentBalance + amount,
    totalCredited: currentTotalCredited + amount,
    totalDebited: existing?.totalDebited ?? 0,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDocument(`${COLLECTION}/${accountId}`, updated);
}

/**
 * Applies a wallet debit event to the projection.
 * [S2] versionGuardAllows enforced before write.
 * [R8] traceId forwarded from EventEnvelope.
 */
export async function applyWalletDebited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  const existing = await getDocument<WalletBalanceView>(`${COLLECTION}/${accountId}`);

  if (aggregateVersion !== undefined) {
    if (
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
      })
    ) {
      return;
    }
  }

  const currentBalance = existing?.balance ?? 0;
  const currentTotalDebited = existing?.totalDebited ?? 0;

  const updated: Omit<WalletBalanceView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    accountId,
    balance: currentBalance - amount,
    totalDebited: currentTotalDebited + amount,
    totalCredited: existing?.totalCredited ?? 0,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDocument(`${COLLECTION}/${accountId}`, updated);
}

/**
 * Syncs the projection balance from the authoritative Account aggregate.
 * Used for initial backfill or to reconcile after STRONG_READ operations.
 * [D5] This is the EVENTUAL_READ surface — true balance lives in the aggregate.
 */
export async function syncWalletBalanceFromAggregate(
  accountId: string,
  authoritative: { balance: number; aggregateVersion?: number; traceId?: string }
): Promise<void> {
  const existing = await getDocument<WalletBalanceView>(`${COLLECTION}/${accountId}`);

  if (authoritative.aggregateVersion !== undefined) {
    if (
      !versionGuardAllows({
        eventVersion: authoritative.aggregateVersion,
        viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
      })
    ) {
      return;
    }
  }

  const updated: Omit<WalletBalanceView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    accountId,
    balance: authoritative.balance,
    totalCredited: existing?.totalCredited ?? 0,
    totalDebited: existing?.totalDebited ?? 0,
    readModelVersion: Date.now(),
    ...(authoritative.aggregateVersion !== undefined
      ? { lastProcessedVersion: authoritative.aggregateVersion }
      : {}),
    ...(authoritative.traceId !== undefined ? { traceId: authoritative.traceId } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDocument(`${COLLECTION}/${accountId}`, updated);
}
