/**
 * skill-xp.slice — _actions.ts
 *
 * Server-side action wrappers for the AccountSkill aggregate.
 *
 * Call path per logic-overview.md [E1]:
 *   SERVER_ACTION_SKILL →|addXp / deductXp Command| ACCOUNT_SKILL_AGGREGATE
 *   ACCOUNT_SKILL_AGGREGATE →|clamp 0~525 · 寫入 Ledger| ACCOUNT_SKILL_XP_LEDGER
 *   ACCOUNT_SKILL_AGGREGATE →|return { newXp, xpDelta }| _actions.ts
 *   _actions.ts →|SkillXpAdded / SkillXpDeducted| ORGANIZATION_EVENT_BUS (via IER routing E1)
 *
 * Per Invariant #3: Application Layer (actions) coordinates cross-BC routing;
 * the Aggregate only enforces domain invariants (#11 #12 #13).
 *
 * Org Skill Tag Pool management actions:
 *   addOrgSkillTagAction  — activate a global skill into the org's pool (Invariant T2)
 *   removeOrgSkillTagAction — deactivate a skill from the org's pool
 */

'use server';

import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';

import { addXp, deductXp } from './_aggregate';
import { addSkillTagToPool, removeSkillTagFromPool } from './_tag-pool';

export interface AddXpInput {
  accountId: string;
  skillId: string;
  delta: number;
  orgId: string;
  reason?: string;
  /** Optional reference to the source domain object (e.g. taskId). */
  sourceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

/**
 * Server Action: add XP to an account's skill.
 * Enforces Ledger write before aggregate update (Invariant #13).
 * Publishes SkillXpAdded to the org event bus after the aggregate write.
 * Per E1: event publishing belongs in the application coordinator (_actions.ts),
 * not in the aggregate, to prevent VS3 → VS4 boundary invasion.
 */
export async function addSkillXp(input: AddXpInput): Promise<CommandResult> {
  try {
    const result = await addXp(input.accountId, input.skillId, input.delta, {
      orgId: input.orgId,
      reason: input.reason,
      sourceId: input.sourceId,
    });
    // D3: aggregate returns computed state; _actions.ts owns the persistence write.
    await setDocument(result.path, result.record);
    // Application coordinator publishes cross-BC skill event (E1 — not from aggregate)
    await publishOrgEvent('organization:skill:xpAdded', {
      accountId: input.accountId,
      orgId: input.orgId,
      skillId: input.skillId,
      xpDelta: result.xpDelta,
      newXp: result.newXp,
      reason: input.reason,
      aggregateVersion: result.version,
      ...(input.traceId ? { traceId: input.traceId } : {}),
    });
    return commandSuccess(input.accountId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('SKILL_XP_ADD_FAILED', message);
  }
}

export interface DeductXpInput {
  accountId: string;
  skillId: string;
  delta: number;
  orgId: string;
  reason?: string;
  sourceId?: string;
  /** Optional trace identifier propagated from CBG_ENTRY [R8]. */
  traceId?: string;
}

/**
 * Server Action: deduct XP from an account's skill.
 * Enforces Ledger write before aggregate update (Invariant #13).
 * Publishes SkillXpDeducted to the org event bus after the aggregate write.
 * Per E1: event publishing belongs in the application coordinator (_actions.ts),
 * not in the aggregate, to prevent VS3 → VS4 boundary invasion.
 */
export async function deductSkillXp(input: DeductXpInput): Promise<CommandResult> {
  try {
    const result = await deductXp(input.accountId, input.skillId, input.delta, {
      orgId: input.orgId,
      reason: input.reason,
      sourceId: input.sourceId,
    });
    // D3: aggregate returns computed state; _actions.ts owns the persistence write.
    await setDocument(result.path, result.record);
    // Application coordinator publishes cross-BC skill event (E1 — not from aggregate)
    await publishOrgEvent('organization:skill:xpDeducted', {
      accountId: input.accountId,
      orgId: input.orgId,
      skillId: input.skillId,
      xpDelta: result.xpDelta,
      newXp: result.newXp,
      reason: input.reason,
      aggregateVersion: result.version,
      ...(input.traceId ? { traceId: input.traceId } : {}),
    });
    return commandSuccess(input.accountId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('SKILL_XP_DEDUCT_FAILED', message);
  }
}

// ---------------------------------------------------------------------------
// Org Skill Tag Pool — server action wrappers (Invariant T2)
// ---------------------------------------------------------------------------

/**
 * Server Action: activate a skill from the global dictionary into the org's pool.
 * The tagSlug MUST already exist in the global centralized-tag dictionary (Invariant T2).
 * Idempotent: calling this when the tag already exists in the pool is a no-op.
 */
export async function addOrgSkillTagAction(
  orgId: string,
  tagSlug: string,
  tagName: string,
  actorId: string
): Promise<CommandResult> {
  try {
    await addSkillTagToPool(orgId, tagSlug, tagName, actorId);
    return commandSuccess(tagSlug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ADD_ORG_SKILL_TAG_FAILED', message);
  }
}

/**
 * Server Action: remove a skill from the org's pool.
 * Blocked when refCount > 0 (active member/partner references exist — Invariant A6).
 * Idempotent: calling this when the tag is absent is a no-op.
 */
export async function removeOrgSkillTagAction(
  orgId: string,
  tagSlug: string
): Promise<CommandResult> {
  try {
    await removeSkillTagFromPool(orgId, tagSlug);
    return commandSuccess(tagSlug, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('REMOVE_ORG_SKILL_TAG_FAILED', message);
  }
}
