/**
 * projection.organization-view — _projector.ts
 *
 * Maintains the organization projection read model.
 * Stored at: organizationView/{orgId}
 *
 * Per logic-overview.md:
 *   EVENT_FUNNEL_INPUT → ORGANIZATION_PROJECTION_VIEW
 */

import { serverTimestamp } from 'firebase/firestore';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared.kernel.version-guard';
import type { Account } from '@/shared/types';

export interface OrganizationViewRecord {
  orgId: string;
  name: string;
  ownerId: string;
  memberCount: number;
  teamCount: number;
  partnerCount: number;
  /** Flat list of member account IDs */
  memberIds: string[];
  /** Map of teamId → team name */
  teamIndex: Record<string, string>;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export async function projectOrganizationSnapshot(
  org: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<OrganizationViewRecord>(`organizationView/${org.id}`);
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const record: Omit<OrganizationViewRecord, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    orgId: org.id,
    name: org.name,
    ownerId: org.ownerId ?? '',
    memberCount: org.members?.length ?? 0,
    teamCount: org.teams?.length ?? 0,
    partnerCount: 0,
    memberIds: org.memberIds ?? [],
    teamIndex: Object.fromEntries(org.teams?.map((t) => [t.id, t.name]) ?? []),
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  };
  await setDocument(`organizationView/${org.id}`, record);
}

export async function applyMemberJoined(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  const view = await getDocument<OrganizationViewRecord>(`organizationView/${orgId}`);

  if (aggregateVersion !== undefined) {
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: view?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const memberIds = [...(view?.memberIds ?? []), memberId];
  await updateDocument(`organizationView/${orgId}`, {
    memberIds,
    memberCount: memberIds.length,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function applyMemberLeft(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  const view = await getDocument<OrganizationViewRecord>(`organizationView/${orgId}`);

  if (aggregateVersion !== undefined) {
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: view?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  const memberIds = (view?.memberIds ?? []).filter((id) => id !== memberId);
  await updateDocument(`organizationView/${orgId}`, {
    memberIds,
    memberCount: memberIds.length,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}
