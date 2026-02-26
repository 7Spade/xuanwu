'use server';

/**
 * account-governance.policy — _actions.ts
 *
 * Server actions for account-level policy management.
 *
 * Per logic-overview.md:
 *   ACCOUNT_POLICY → CUSTOM_CLAIMS
 *   Policy changes are account-scoped; CUSTOM_CLAIMS refresh is triggered downstream
 *   by account governance logic (not via org event bus — this is an account-level BC).
 *
 * Invariant #1: This BC only writes its own aggregate.
 * Invariant #3: Application layer coordinates flow only.
 * [R8] TRACE_PROPAGATION_RULE: traceId is carried from CBG_ENTRY into the persisted
 *   policy record for auditability. Must NOT be regenerated here.
 */

import { addDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';

// ---------------------------------------------------------------------------
// TOKEN_REFRESH_SIGNAL helper [S6]
// Defined locally per VSA cross-slice boundary rules (no import from account-governance.role).
// ---------------------------------------------------------------------------

/**
 * Writes a TOKEN_REFRESH_SIGNAL document for the affected account.
 * Frontend onSnapshot on `tokenRefreshSignals/{accountId}` force-refreshes the token.
 * Per [SK_TOKEN_REFRESH_CONTRACT: CLIENT_TOKEN_REFRESH_OBLIGATION][S6].
 */
async function emitPolicyChangedRefreshSignal(accountId: string, traceId?: string): Promise<void> {
  await updateDocument(`tokenRefreshSignals/${accountId}`, {
    accountId,
    reason: 'policy:changed',
    issuedAt: new Date().toISOString(),
    ...(traceId ? { traceId } : {}),
  });
}

export interface AccountPolicy {
  id: string;
  accountId: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** TraceID propagated from CBG_ENTRY for auditability [R8]. */
  traceId?: string;
}

export interface PolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
}

export interface CreatePolicyInput {
  accountId: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

export interface UpdatePolicyInput {
  /** Account that owns this policy. When provided, a TOKEN_REFRESH_SIGNAL is emitted [S6].
   *  Optional: callers that don't have accountId in scope may omit; Claims re-sync on next token expiry. */
  accountId?: string;
  name?: string;
  description?: string;
  rules?: PolicyRule[];
  isActive?: boolean;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

/**
 * Creates a new account policy.
 * CUSTOM_CLAIMS refresh is triggered by the governance layer reading updated policies.
 * Returns CommandSuccess with the created policy ID as aggregateId.
 * traceId is stored in the record for auditability [R8].
 */
export async function createAccountPolicy(input: CreatePolicyInput): Promise<CommandResult> {
  try {
    const now = new Date().toISOString();
    const ref = await addDocument<Omit<AccountPolicy, 'id'>>(
      `accountPolicies`,
      {
        accountId: input.accountId,
        name: input.name,
        description: input.description,
        rules: input.rules,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        ...(input.traceId ? { traceId: input.traceId } : {}),
      }
    );
    return commandSuccess(ref.id, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('POLICY_CREATE_FAILED', message);
  }
}

/**
 * Updates an existing account policy.
 * Emits TOKEN_REFRESH_SIGNAL so the frontend refreshes Claims [S6].
 * traceId is stored in the record for auditability [R8].
 */
export async function updateAccountPolicy(
  policyId: string,
  input: UpdatePolicyInput
): Promise<CommandResult> {
  try {
    const { traceId, accountId, ...fields } = input;
    await updateDocument(`accountPolicies/${policyId}`, {
      ...fields,
      updatedAt: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    });

    // PolicyChanged → TOKEN_REFRESH_SIGNAL [S6]
    // Best-effort: signal failure does NOT roll back the policy update.
    // accountId is optional — signal is only emitted when the caller provides it.
    if (accountId) {
      try {
        await emitPolicyChangedRefreshSignal(accountId, traceId);
      } catch (sigErr) {
        // Log signal failure for observability; Claims re-sync on next token expiry.
        console.error('[account-governance.policy] Failed to emit TOKEN_REFRESH_SIGNAL after policy update:', sigErr);
      }
    }

    return commandSuccess(policyId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('POLICY_UPDATE_FAILED', message);
  }
}

/**
 * Deletes an account policy.
 */
export async function deleteAccountPolicy(policyId: string): Promise<CommandResult> {
  try {
    await deleteDocument(`accountPolicies/${policyId}`);
    return commandSuccess(policyId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('POLICY_DELETE_FAILED', message);
  }
}
