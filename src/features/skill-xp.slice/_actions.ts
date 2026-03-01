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
 */

'use server';

import { addXp, deductXp } from './_aggregate';
import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';

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
