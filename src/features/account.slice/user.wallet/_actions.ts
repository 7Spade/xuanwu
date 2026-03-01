'use server';

/**
 * account-user.wallet — _actions.ts
 *
 * Server actions for user wallet balance management.
 *
 * Per logic-overview.md (A1):
 *   USER_WALLET_AGGREGATE — strong consistency balance invariant.
 *   Balance must never go negative.
 *
 * Architecture:
 *   Wallet balance is stored inline on accounts/{userId}.wallet.balance.
 *   Detailed transaction history will go in accounts/{userId}/walletTransactions (future).
 *
 * Invariant #1: This BC only writes its own aggregate (user account document).
 */

import { collection, doc, runTransaction, serverTimestamp, type Transaction } from 'firebase/firestore';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel/command-result-contract';

export interface WalletTransaction {
  id?: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  referenceId?: string;
  occurredAt: ReturnType<typeof serverTimestamp>;
}

export interface TopUpInput {
  accountId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

export interface DebitInput {
  accountId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

/**
 * Credits the wallet balance.
 * Uses a Firestore transaction to ensure atomic read-modify-write.
 * Appends a ledger entry to the walletTransactions sub-collection.
 */
export async function creditWallet(input: TopUpInput): Promise<CommandResult> {
  if (input.amount <= 0) {
    return commandFailureFrom(
      'WALLET_CREDIT_INVALID_AMOUNT',
      `credit amount must be positive (got ${input.amount})`
    );
  }

  try {
    const accountRef = doc(db, 'accounts', input.accountId);
    const txRef = doc(collection(db, `accounts/${input.accountId}/walletTransactions`));

    await runTransaction(db, async (tx: Transaction) => {
      const snap = await tx.get(accountRef);
      if (!snap.exists()) throw new Error(`Account ${input.accountId} not found`);

      const current: number = (snap.data()?.wallet?.balance as number) ?? 0;
      const next = current + input.amount;

      tx.update(accountRef, { 'wallet.balance': next });
      tx.set(txRef, {
        accountId: input.accountId,
        type: 'credit',
        amount: input.amount,
        reason: input.reason,
        referenceId: input.referenceId ?? null,
        occurredAt: serverTimestamp(),
      });
    });

    return commandSuccess(input.accountId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WALLET_CREDIT_FAILED', message);
  }
}

/**
 * Debits the wallet balance.
 * Enforces non-negative balance invariant.
 */
export async function debitWallet(input: DebitInput): Promise<CommandResult> {
  if (input.amount <= 0) {
    return commandFailureFrom(
      'WALLET_DEBIT_INVALID_AMOUNT',
      `debit amount must be positive (got ${input.amount})`
    );
  }

  try {
    const accountRef = doc(db, 'accounts', input.accountId);
    const txRef = doc(collection(db, `accounts/${input.accountId}/walletTransactions`));

    await runTransaction(db, async (tx: Transaction) => {
      const snap = await tx.get(accountRef);
      if (!snap.exists()) throw new Error(`Account ${input.accountId} not found`);

      const current: number = (snap.data()?.wallet?.balance as number) ?? 0;
      if (current < input.amount) {
        throw new Error(`Insufficient balance: ${current} < ${input.amount}`);
      }
      const next = current - input.amount;

      tx.update(accountRef, { 'wallet.balance': next });
      tx.set(txRef, {
        accountId: input.accountId,
        type: 'debit',
        amount: input.amount,
        reason: input.reason,
        referenceId: input.referenceId ?? null,
        occurredAt: serverTimestamp(),
      });
    });

    return commandSuccess(input.accountId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WALLET_DEBIT_FAILED', message);
  }
}
