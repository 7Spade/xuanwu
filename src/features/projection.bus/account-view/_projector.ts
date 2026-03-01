/**
 * projection.account-view — _projector.ts
 *
 * Maintains the account projection read model + authority snapshot.
 * Implements shared-kernel.authority-snapshot contract.
 *
 * Stored at: accountView/{accountId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ACCOUNT_PROJECTION_VIEW
 *   ACCOUNT_USER_NOTIFICATION -.→ ACCOUNT_PROJECTION_VIEW (content filtering by tag)
 *   ACCOUNT_PROJECTION_VIEW -.→ shared-kernel.authority-snapshot (contract)
 */

import { serverTimestamp } from 'firebase/firestore';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared.kernel.version-guard';
import type { AuthoritySnapshot } from '@/features/shared.kernel.authority-snapshot';
import type { Account } from '@/shared/types';

export interface AccountViewRecord {
  readonly implementsAuthoritySnapshot: true;
  accountId: string;
  name: string;
  accountType: 'user' | 'organization';
  email?: string;
  photoURL?: string;
  /** Roles this account holds across all org memberships (denormalized) */
  orgRoles: Record<string, string>; // orgId → role
  /** Skill tag slugs granted to this account */
  skillTagSlugs: string[];
  /** Internal/external membership flag for notification content filtering */
  membershipTag?: 'internal' | 'external';
  /** Latest authority snapshot */
  authoritySnapshot?: AuthoritySnapshot;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export async function projectAccountSnapshot(
  account: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountViewRecord>(`accountView/${account.id}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const record: Omit<AccountViewRecord, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    implementsAuthoritySnapshot: true,
    accountId: account.id,
    name: account.name,
    accountType: account.accountType,
    email: account.email,
    photoURL: account.photoURL,
    orgRoles: {},
    skillTagSlugs: account.skillGrants?.map((sg) => sg.tagSlug) ?? [],
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };
  await setDocument(`accountView/${account.id}`, record);
}

export async function applyOrgRoleChange(
  accountId: string,
  orgId: string,
  role: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountViewRecord>(`accountView/${accountId}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await updateDocument(`accountView/${accountId}`, {
    [`orgRoles.${orgId}`]: role,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function applyAuthoritySnapshot(
  accountId: string,
  snapshot: AuthoritySnapshot,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountViewRecord>(`accountView/${accountId}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await updateDocument(`accountView/${accountId}`, {
    authoritySnapshot: snapshot,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}
