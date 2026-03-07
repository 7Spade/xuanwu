/**
 * projection.account-skill-view — _projector.ts
 *
 * Maintains the per-account skill XP read model.
 *
 * Per 00-LogicOverview.md (VS3 → STD_PROJ_LANE):
 *   SKILL_V["projection.account-skill-view\n[S2: SK_VERSION_GUARD]"]
 *
 * Stored at: accountSkillView/{accountId}
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 * [#12] getTier is a pure function — tier is never stored, always derived.
 * [#13] Every XP mutation must have already written the Ledger (VS3 concern);
 *        this projector only maintains the read-side snapshot.
 *
 * Feed path: IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE → here.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { setDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { serverTimestamp } from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';

// ---------------------------------------------------------------------------
// Read model shape
// ---------------------------------------------------------------------------

export interface AccountSkillEntry {
  /** tagSlug — read-only semantic reference [D21-2] */
  readonly tagSlug: string;
  /** Current XP balance for this skill */
  xp: number;
  /** Last aggregate version processed [S2] */
  lastProcessedVersion: number;
}

export interface AccountSkillView {
  readonly accountId: string;
  /** Map of tagSlug → skill entry */
  skills: Record<string, AccountSkillEntry>;
  /** Monotonically increasing projection version [S2] */
  lastProcessedVersion: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

// ---------------------------------------------------------------------------
// Firestore path
// ---------------------------------------------------------------------------

function skillViewPath(accountId: string): string {
  return `accountSkillView/${accountId}`;
}

// ---------------------------------------------------------------------------
// Projector functions (called by Event Funnel)
// ---------------------------------------------------------------------------

/**
 * Applies a SkillXpAdded event to the account skill view.
 *
 * [S2] Skips the write if the incoming aggregateVersion is not newer than
 *       the last processed version in the current projection.
 * [R8] traceId forwarded from EventEnvelope.
 * [#12] Tier is not stored; consumers derive it via getTier(xp) from shared-kernel.
 */
export async function applySkillXpAdded(params: {
  accountId: string;
  tagSlug: string;
  deltaXp: number;
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { accountId, tagSlug, deltaXp, aggregateVersion, traceId } = params;

  const existing = await getDocument<AccountSkillView>(skillViewPath(accountId));
  const currentEntry = existing?.skills?.[tagSlug];

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: currentEntry?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }

  const updatedSkills: Record<string, AccountSkillEntry> = {
    ...(existing?.skills ?? {}),
    [tagSlug]: {
      tagSlug,
      xp: (currentEntry?.xp ?? 0) + deltaXp,
      lastProcessedVersion: aggregateVersion,
    },
  };

  const view: Omit<AccountSkillView, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    accountId,
    skills: updatedSkills,
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(skillViewPath(accountId), view);
}

/**
 * Applies a SkillXpDeducted event to the account skill view.
 *
 * [S2] Version guard enforced; stale events are discarded.
 * [R8] traceId forwarded.
 */
export async function applySkillXpDeducted(params: {
  accountId: string;
  tagSlug: string;
  deltaXp: number;
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { accountId, tagSlug, deltaXp, aggregateVersion, traceId } = params;

  const existing = await getDocument<AccountSkillView>(skillViewPath(accountId));
  const currentEntry = existing?.skills?.[tagSlug];

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: currentEntry?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }

  const updatedSkills: Record<string, AccountSkillEntry> = {
    ...(existing?.skills ?? {}),
    [tagSlug]: {
      tagSlug,
      xp: Math.max(0, (currentEntry?.xp ?? 0) - deltaXp),
      lastProcessedVersion: aggregateVersion,
    },
  };

  const view: Omit<AccountSkillView, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    accountId,
    skills: updatedSkills,
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(skillViewPath(accountId), view);
}
