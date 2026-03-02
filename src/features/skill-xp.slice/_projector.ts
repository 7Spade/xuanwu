/**
 * skill-xp.slice — _projector.ts
 *
 * Account skill read model: tracks accountId → skillId → xp.
 *
 * Per logic-overview.md invariants:
 *   #12 — Tier is NEVER stored; always computed via resolveSkillTier(xp).
 *   #14 — Schedule reads this projection; never queries Account aggregate directly.
 *
 * Stored at: accountSkillView/{accountId}/skills/{skillId}
 *
 * Event sources (via EVENT_FUNNEL_INPUT):
 *   organization:skill:xpAdded   → applySkillXpAdded
 *   organization:skill:xpDeducted → applySkillXpDeducted
 */

import { serverTimestamp } from 'firebase/firestore';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared-kernel';

/**
 * Per-skill entry stored in Firestore.
 * NOTE: `tier` is intentionally absent — derived at read time via resolveSkillTier(xp).
 */
export interface AccountSkillEntry {
  accountId: string;
  /** tagSlug — portable skill identifier (matches SkillGrant.tagSlug). */
  skillId: string;
  /** Clamped XP 0–525. The ONLY persisted skill attribute (Invariant #12). */
  xp: number;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

function skillPath(accountId: string, skillId: string): string {
  return `accountSkillView/${accountId}/skills/${skillId}`;
}

/**
 * Applies a SkillXpAdded event to the read model.
 */
export async function applySkillXpAdded(
  accountId: string,
  skillId: string,
  newXp: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountSkillEntry>(skillPath(accountId, skillId));
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await setDocument(skillPath(accountId, skillId), {
    accountId,
    skillId,
    xp: newXp,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  } satisfies AccountSkillEntry);
}

/**
 * Applies a SkillXpDeducted event to the read model.
 */
export async function applySkillXpDeducted(
  accountId: string,
  skillId: string,
  newXp: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void> {
  if (aggregateVersion !== undefined) {
    const existing = await getDocument<AccountSkillEntry>(skillPath(accountId, skillId));
    if (!versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })) {
      return;
    }
  }

  await setDocument(skillPath(accountId, skillId), {
    accountId,
    skillId,
    xp: newXp,
    readModelVersion: Date.now(),
    ...(aggregateVersion !== undefined ? { lastProcessedVersion: aggregateVersion } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    updatedAt: serverTimestamp(),
  } satisfies AccountSkillEntry);
}
