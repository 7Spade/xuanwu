/**
 * projection.org-eligible-member-view — _projector.ts
 *
 * Organization-scoped eligible member read model.
 * Used exclusively by organization.schedule to determine assignable members
 * and validate skill tier requirements WITHOUT querying Account aggregates directly.
 *
 * Per logic-overview.md invariants:
 *   #12 — Tier is NEVER stored; derived at query time via resolveSkillTier(xp).
 *   #14 — Schedule reads ONLY this projection (org-eligible-member-view).
 *
 * Stored at: orgEligibleMemberView/{orgId}/members/{accountId}
 *
 * Event sources (via EVENT_FUNNEL_INPUT):
 *   organization:skill:xpAdded   → applyOrgMemberSkillXp
 *   organization:skill:xpDeducted → applyOrgMemberSkillXp
 *   organization:member:joined    → initOrgMemberEntry
 *   organization:member:left      → removeOrgMemberEntry
 */

import { serverTimestamp } from 'firebase/firestore';
import { setDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared.kernel.version-guard';

/**
 * Per-member entry stored in Firestore.
 *
 * `skills` maps tagSlug → { xp }.
 * `tier` is intentionally absent — derived at read time via resolveSkillTier(xp).
 * `eligible` is a fast-path flag; consumers SHOULD re-verify via skill requirements.
 * `lastProcessedVersion` is the highest aggregateVersion seen for this member's
 *   eligibility-affecting events; used by ELIGIBLE_UPDATE_GUARD [R7][#19].
 */
export interface OrgEligibleMemberEntry {
  orgId: string;
  accountId: string;
  /** Map of skillId (tagSlug) → { xp }. Tier must be derived, never stored. */
  skills: Record<string, { xp: number }>;
  /** True when the member has no active conflicting assignments and is in the org. */
  eligible: boolean;
  /**
   * Highest aggregateVersion processed for this entry's eligibility. [R7][#19]
   * ELIGIBLE_UPDATE_GUARD: only update when incomingVersion > lastProcessedVersion.
   * Prevents out-of-order events (e.g. ScheduleCompleted arriving before ScheduleAssigned)
   * from reverting the eligible flag to an incorrect state.
   */
  lastProcessedVersion: number;
  /**
   * Highest skill-aggregate version processed for XP updates. [S2]
   * XP_VERSION_GUARD: only update when incomingSkillVersion > lastProcessedSkillVersion.
   * Prevents stale XP from overwriting a newer value due to out-of-order delivery.
   */
  lastProcessedSkillVersion: number;
  readModelVersion: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

function memberPath(orgId: string, accountId: string): string {
  return `orgEligibleMemberView/${orgId}/members/${accountId}`;
}

/**
 * Creates a bare eligible-member entry when a member joins the organization.
 */
export async function initOrgMemberEntry(
  orgId: string,
  accountId: string,
  traceId?: string
): Promise<void> {
  await setDocument(memberPath(orgId, accountId), {
    orgId,
    accountId,
    skills: {},
    eligible: true,
    lastProcessedVersion: 0,
    lastProcessedSkillVersion: 0,
    readModelVersion: Date.now(),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  } satisfies OrgEligibleMemberEntry);
}

/**
 * Removes a member entry when they leave the organization.
 */
export async function removeOrgMemberEntry(
  orgId: string,
  accountId: string
): Promise<void> {
  await deleteDocument(memberPath(orgId, accountId));
}

export interface ApplyOrgMemberSkillXpInput {
  orgId: string;
  accountId: string;
  skillId: string;
  newXp: number;
  traceId?: string;
  /** Skill aggregate version — used by S2 XP_VERSION_GUARD. */
  aggregateVersion?: number;
}

/**
 * Updates the XP for a specific skill on a member's eligible-member entry.
 * Creates the entry if it does not yet exist.
 *
 * Enforces SK_VERSION_GUARD [S2] via `versionGuardAllows` using
 * `lastProcessedSkillVersion` to discard stale out-of-order XP events.
 *
 * Called when organization:skill:xpAdded or organization:skill:xpDeducted fires.
 */
export async function applyOrgMemberSkillXp(
  input: ApplyOrgMemberSkillXpInput
): Promise<void> {
  const { orgId, accountId, skillId, newXp, traceId, aggregateVersion } = input;
  const existing = await getDocument<OrgEligibleMemberEntry>(
    memberPath(orgId, accountId)
  );

  if (existing) {
    // [S2] XP_VERSION_GUARD: discard stale events when aggregateVersion is provided.
    if (
      aggregateVersion !== undefined &&
      !versionGuardAllows({
        eventVersion: aggregateVersion,
        viewLastProcessedVersion: existing.lastProcessedSkillVersion ?? 0,
      })
    ) {
      return;
    }
    await updateDocument(memberPath(orgId, accountId), {
      [`skills.${skillId}`]: { xp: newXp },
      ...(aggregateVersion !== undefined ? { lastProcessedSkillVersion: aggregateVersion } : {}),
      readModelVersion: Date.now(),
      ...(traceId !== undefined ? { traceId } : {}),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDocument(memberPath(orgId, accountId), {
      orgId,
      accountId,
      skills: { [skillId]: { xp: newXp } },
      eligible: true,
      lastProcessedVersion: 0,
      lastProcessedSkillVersion: aggregateVersion ?? 0,
      readModelVersion: Date.now(),
      ...(traceId !== undefined ? { traceId } : {}),
      updatedAt: serverTimestamp(),
    } satisfies OrgEligibleMemberEntry);
  }
}

/**
 * Updates the eligible flag for a member with ELIGIBLE_UPDATE_GUARD. [R7][#19][D11][S2]
 *
 * Uses SK_VERSION_GUARD [S2] via `versionGuardAllows` to enforce monotonic version.
 * If the incoming version is not strictly greater than the stored version, the event
 * is stale (out-of-order delivery) — discard silently.
 *
 * Called when:
 *   organization:schedule:assigned  → eligible = false (member is now busy)
 *   organization:schedule:completed / organization:schedule:cancelled → eligible = true (member is free)
 *
 * Per Invariant #15: eligible must reflect "no active conflicting assignments".
 * Per Invariant #19: eligible update must use aggregateVersion monotonic increase as prerequisite.
 */
export async function updateOrgMemberEligibility(
  orgId: string,
  accountId: string,
  eligible: boolean,
  incomingAggregateVersion: number,
  traceId?: string
): Promise<void> {
  const existing = await getDocument<OrgEligibleMemberEntry>(memberPath(orgId, accountId));

  // SK_VERSION_GUARD [S2]: discard stale / out-of-order events
  if (existing && !versionGuardAllows({ eventVersion: incomingAggregateVersion, viewLastProcessedVersion: existing.lastProcessedVersion })) {
    return;
  }

  await updateDocument(memberPath(orgId, accountId), {
    eligible,
    lastProcessedVersion: incomingAggregateVersion,
    readModelVersion: Date.now(),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  });
}
