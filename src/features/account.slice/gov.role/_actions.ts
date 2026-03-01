'use server';

/**
 * account-governance.role — _actions.ts
 *
 * Server actions for account role management.
 *
 * Per logic-overview.md:
 *   ACCOUNT_ROLE → CUSTOM_CLAIMS
 *   Role changes trigger CUSTOM_CLAIMS refresh.
 *
 * Per logic-overview.md [R2] TOKEN_REFRESH_SIGNAL:
 *   After claims are set, write a TOKEN_REFRESH_SIGNAL document so the
 *   frontend can detect the change and force a token refresh.
 *   Semantics: high-priority eventual consistency (async — Firebase limitation).
 *   The frontend detects this via onSnapshot on `tokenRefreshSignals/{accountId}`.
 *
 * Invariants:
 *   #1 — This BC only writes its own aggregate.
 *   #5 — Custom Claims are a permission cache, not the source of truth.
 *   R2  — CRITICAL_LANE semantics: high-priority, not synchronous.
 */

import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel/command-result-contract';
import type { OrganizationRole } from '@/shared/types';

export interface AccountRoleRecord {
  accountId: string;
  orgId: string;
  role: OrganizationRole;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
  isActive: boolean;
  /** TraceID propagated from CBG_ENTRY for auditability [R8]. */
  traceId?: string;
}

export interface AssignRoleInput {
  accountId: string;
  orgId: string;
  role: OrganizationRole;
  grantedBy: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

/**
 * Assigns an org-level role to an account.
 * Publishes OrgMemberJoined event downstream — triggers CUSTOM_CLAIMS refresh.
 * Emits TOKEN_REFRESH_SIGNAL after role change so the frontend refreshes its token. [R2]
 */
export async function assignAccountRole(input: AssignRoleInput): Promise<CommandResult> {
  try {
    const record: AccountRoleRecord = {
      accountId: input.accountId,
      orgId: input.orgId,
      role: input.role,
      grantedBy: input.grantedBy,
      grantedAt: new Date().toISOString(),
      isActive: true,
      ...(input.traceId ? { traceId: input.traceId } : {}),
    };

    await setDocument(
      `accountRoles/${input.orgId}_${input.accountId}`,
      record
    );

    await publishOrgEvent('organization:member:joined', {
      orgId: input.orgId,
      accountId: input.accountId,
      role: input.role,
      joinedBy: input.grantedBy,
    });

    // TOKEN_REFRESH_SIGNAL [R2]: notify frontend that claims have changed.
    // Wrapped in try-catch: a signal failure must NOT roll back the role assignment.
    // Frontend will re-sync on next token expiry / page reload in the worst case.
    try {
      await emitTokenRefreshSignal(input.accountId, 'role:assigned');
    } catch (err) {
      console.error('[account-governance.role] Failed to emit TOKEN_REFRESH_SIGNAL after role assign:', err);
    }

    return commandSuccess(input.accountId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ROLE_ASSIGN_FAILED', message);
  }
}

/**
 * Revokes an org-level role from an account.
 * Publishes OrgMemberLeft event downstream — triggers CUSTOM_CLAIMS refresh.
 * Emits TOKEN_REFRESH_SIGNAL after role change so the frontend refreshes its token. [R2]
 * [R8] traceId propagated from CBG_ENTRY into event publish and signal document.
 */
export async function revokeAccountRole(
  accountId: string,
  orgId: string,
  revokedBy: string,
  traceId?: string
): Promise<CommandResult> {
  try {
    await updateDocument(`accountRoles/${orgId}_${accountId}`, {
      isActive: false,
      revokedAt: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    });

    await publishOrgEvent('organization:member:left', {
      orgId,
      accountId,
      removedBy: revokedBy,
      ...(traceId ? { traceId } : {}),
    });

    // TOKEN_REFRESH_SIGNAL [R2]: notify frontend that claims have changed.
    // Wrapped in try-catch: a signal failure must NOT roll back the role revocation.
    try {
      await emitTokenRefreshSignal(accountId, 'role:revoked', traceId);
    } catch (err) {
      console.error('[account-governance.role] Failed to emit TOKEN_REFRESH_SIGNAL after role revoke:', err);
    }

    return commandSuccess(accountId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ROLE_REVOKE_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// TOKEN_REFRESH_SIGNAL helper [R2]
// ---------------------------------------------------------------------------

/** Reason that triggered the token refresh signal. */
export type TokenRefreshReason = 'role:assigned' | 'role:revoked' | 'claims:refreshed';

/** Shape of the signal document written to Firestore. */
export interface TokenRefreshSignal {
  accountId: string;
  reason: TokenRefreshReason;
  /** ISO 8601 timestamp. Frontend uses this to detect new signals (idempotent on repeat). */
  issuedAt: string;
  /** [R8] Trace identifier propagated from CBG_ENTRY for distributed tracing. */
  traceId?: string;
}

/**
 * Writes a TOKEN_REFRESH_SIGNAL document that notifies the frontend to force a
 * token refresh. [R2]
 *
 * Stored at: tokenRefreshSignals/{accountId}
 * Frontend onSnapshot listener calls user.getIdToken(true) when this changes.
 *
 * Semantics: high-priority eventual consistency.
 * (Not synchronous — Firebase architecture does not allow synchronous claims propagation.)
 *
 * Security: accountId is validated against a safe Firestore document ID pattern
 * to prevent path-traversal injection [OWASP: A01 / CWE-22].
 */
async function emitTokenRefreshSignal(
  accountId: string,
  reason: TokenRefreshReason,
  traceId?: string
): Promise<void> {
  // Guard against path-traversal: accountId must be a safe Firestore document ID
  // (alphanumeric, hyphens, underscores only — no slashes or special chars).
  if (!/^[\w-]+$/.test(accountId)) {
    throw new Error(`Invalid accountId format — must match /^[\\w-]+$/`);
  }
  const signal: TokenRefreshSignal = {
    accountId,
    reason,
    issuedAt: new Date().toISOString(),
    ...(traceId ? { traceId } : {}),
  };
  await setDocument(`tokenRefreshSignals/${accountId}`, signal);
}
