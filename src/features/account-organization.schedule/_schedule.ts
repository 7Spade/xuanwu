/**
 * account-organization.schedule — _schedule.ts
 *
 * organization.schedule Aggregate Root — manages the Schedule lifecycle:
 *   draft → proposed → confirmed | cancelled
 *
 * Per logic-overview.md:
 *   WORKSPACE_OUTBOX →|ScheduleProposed（跨層事件 · saga）| ORGANIZATION_SCHEDULE
 *   ORGANIZATION_SCHEDULE → ORGANIZATION_EVENT_BUS → ACCOUNT_NOTIFICATION_ROUTER (FCM Layer 2+)
 *
 * Aggregate lifecycle (state machine):
 *   draft → proposed → confirmed → completed        (normal path)
 *                                 → assignmentCancelled  (post-approval cancellation)
 *                    → cancelled                    (proposal rejected / compensating path)
 *
 * Invariants respected:
 *   #1  — This BC only writes its own aggregate (orgScheduleProposals collection).
 *   #2  — Reads workspace schedule data only via the event payload (not domain model).
 *   #4a — Domain Events produced by ORGANIZATION_SCHEDULE aggregate only.
 *   #4b — Transaction Runner only delivers to Outbox; does not produce Domain Events.
 *   #12 — Tier is NEVER stored. Only xp is persisted; getTier(xp) is computed at runtime.
 *   #14 — Schedule reads ONLY projection.org-eligible-member-view, never Account aggregate.
 *   A5  — ScheduleAssignRejected is the compensating event when skill validation fails.
 */

import { z } from 'zod';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { publishOrgEvent } from '@/features/account-organization.event-bus';
import { getOrgMemberEligibility } from '@/features/projection.org-eligible-member-view';
import { resolveSkillTier, tierSatisfies } from '@/features/shared.kernel.skill-tier';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared.kernel.skill-tier';
import type { SkillRequirement } from '@/shared/types';

// =================================================================
// Aggregate State (DDD state machine)
// =================================================================

/**
 * Aggregate lifecycle states for organization.schedule.
 *
 *   draft               — initial state; exists only in memory / not yet persisted
 *   proposed            — received from workspace layer; persisted, awaiting org approval
 *   confirmed           — skill check passed; ScheduleAssigned event published
 *   cancelled           — skill check failed or manually cancelled; ScheduleAssignRejected published
 *   completed           — assignment successfully fulfilled; ScheduleCompleted event published
 *   assignmentCancelled — confirmed assignment withdrawn post-approval; ScheduleAssignmentCancelled event published
 */
export const ORG_SCHEDULE_STATUSES = ['draft', 'proposed', 'confirmed', 'cancelled', 'completed', 'assignmentCancelled'] as const;
export type OrgScheduleStatus = (typeof ORG_SCHEDULE_STATUSES)[number];

// =================================================================
// Zod Schemas — strict validation on input data
// =================================================================

const skillRequirementSchema = z.object({
  tagSlug: z.string().min(1),
  tagId: z.string().optional(),
  minimumTier: z.enum(['apprentice', 'journeyman', 'expert', 'artisan', 'grandmaster', 'legendary', 'titan']),
  quantity: z.number().int().min(1),
});

export const orgScheduleProposalSchema = z.object({
  scheduleItemId: z.string().min(1),
  workspaceId: z.string().min(1),
  orgId: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  proposedBy: z.string().min(1),
  status: z.enum(ORG_SCHEDULE_STATUSES),
  receivedAt: z.string(),
  /** SourcePointer: IntentID of the ParsingIntent that triggered this proposal (optional). */
  intentId: z.string().optional(),
  /** Skill requirements carried over from the workspace proposal — used during org approval. */
  skillRequirements: z.array(skillRequirementSchema).optional(),
  /** Sub-location within the workspace. FR-L2. */
  locationId: z.string().optional(),
  /**
   * Aggregate version of this org-schedule proposal. [R7]
   * Incremented on each state transition (proposed → confirmed/cancelled).
   * Included in published events so ELIGIBLE_UPDATE_GUARD can enforce monotonic updates.
   */
  version: z.number().int().min(1).default(1),
  /** [R8] TraceID injected at CBG_ENTRY — persisted for end-to-end audit trail. */
  traceId: z.string().optional(),
});

export type OrgScheduleProposal = z.infer<typeof orgScheduleProposalSchema>;

// =================================================================
// Domain Service: handleScheduleProposed
// =================================================================

/**
 * Handles a ScheduleProposed cross-layer event arriving from WORKSPACE_OUTBOX.
 *
 * Persists a `proposed` org schedule proposal for governance review.
 * Does NOT immediately assign — assignment requires explicit governance approval
 * via approveOrgScheduleProposal().
 */
export async function handleScheduleProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void> {
  const proposal: OrgScheduleProposal = orgScheduleProposalSchema.parse({
    scheduleItemId: payload.scheduleItemId,
    workspaceId: payload.workspaceId,
    orgId: payload.orgId,
    title: payload.title,
    startDate: payload.startDate,
    endDate: payload.endDate,
    proposedBy: payload.proposedBy,
    status: 'proposed',
    receivedAt: new Date().toISOString(),
    intentId: payload.intentId,
    // Persist skill requirements so org governance can validate without re-fetching workspace data.
    ...(payload.skillRequirements?.length ? { skillRequirements: payload.skillRequirements } : {}),
    // Persist sub-location reference. FR-L2.
    ...(payload.locationId ? { locationId: payload.locationId } : {}),
    // [R8] Persist traceId for end-to-end audit trail.
    ...(payload.traceId ? { traceId: payload.traceId } : {}),
  });
  await setDocument(`orgScheduleProposals/${payload.scheduleItemId}`, proposal);
}

// =================================================================
// Domain Service: approveOrgScheduleProposal
// =================================================================

/**
 * Result type for approveOrgScheduleProposal — enables callers to handle
 * both outcomes without catching exceptions (Compensating Event pattern).
 */
export type ScheduleApprovalResult =
  | { outcome: 'confirmed'; scheduleItemId: string }
  | { outcome: 'rejected'; scheduleItemId: string; reason: string };

/**
 * Called by org-layer governance when a pending proposal should be assigned.
 *
 * Skill Validation (Invariant #14 + #12):
 *   1. Reads projection.org-eligible-member-view (never Account aggregate).
 *   2. For each SkillRequirement, derives tier via resolveSkillTier(xp) — NOT from DB.
 *   3. If all requirements are met → confirms and publishes `organization:schedule:assigned`.
 *   4. If any requirement fails → cancels and publishes `organization:schedule:assignRejected`
 *      (Compensating Event per Invariant A5). B-track issues do NOT flow back to A-track tasks.
 *
 * @param scheduleItemId  The proposal to approve.
 * @param targetAccountId The member to assign.
 * @param assignedBy      Actor performing the approval.
 * @param opts            Proposal metadata (workspaceId, orgId, title, dates).
 * @param skillRequirements Optional skill requirements to validate against the member.
 */
export async function approveOrgScheduleProposal(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    /** [R8] TraceID propagated from the originating WorkspaceScheduleProposed event. */
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<ScheduleApprovalResult> {
  // --- Skill Validation via Projection (Invariant #14) ---
  if (skillRequirements && skillRequirements.length > 0) {
    const memberView = await getOrgMemberEligibility(opts.orgId, targetAccountId);

    if (!memberView || !memberView.eligible) {
      const reason = memberView
        ? 'Member is marked ineligible in org-eligible-member-view.'
        : 'Member not found in org-eligible-member-view projection.';
      await _cancelProposal(scheduleItemId, targetAccountId, opts, reason);
      return { outcome: 'rejected', scheduleItemId, reason };
    }

    // Validate each skill requirement — tier derived via getTier(xp), never from DB (Invariant #12)
    for (const req of skillRequirements) {
      const skillEntry = memberView.skills[req.tagSlug];

      if (!skillEntry) {
        // Member has no record for this skill — different from 0 XP; reject with a clear message.
        const reason = `Skill "${req.tagSlug}" is not present in the member's skill projection.`;
        await _cancelProposal(scheduleItemId, targetAccountId, opts, reason);
        return { outcome: 'rejected', scheduleItemId, reason };
      }

      const memberTier = resolveSkillTier(skillEntry.xp);

      if (!tierSatisfies(memberTier, req.minimumTier)) {
        const reason =
          `Skill "${req.tagSlug}" requires tier "${req.minimumTier}" ` +
          `but member has tier "${memberTier}" (xp=${skillEntry.xp}).`;
        await _cancelProposal(scheduleItemId, targetAccountId, opts, reason);
        return { outcome: 'rejected', scheduleItemId, reason };
      }
    }
  }

  // --- All checks passed → Confirm ---
  // Read current version and increment to ensure proper aggregateVersion for ELIGIBLE_UPDATE_GUARD [R7]
  const existing = await getDocument<OrgScheduleProposal>(`orgScheduleProposals/${scheduleItemId}`);
  const nextVersion = (existing?.version ?? 1) + 1;

  await updateDocument(`orgScheduleProposals/${scheduleItemId}`, {
    status: 'confirmed' satisfies OrgScheduleStatus,
    version: nextVersion,
  });

  await publishOrgEvent('organization:schedule:assigned', {
    scheduleItemId,
    workspaceId: opts.workspaceId,
    orgId: opts.orgId,
    targetAccountId,
    assignedBy,
    startDate: opts.startDate,
    endDate: opts.endDate,
    title: opts.title,
    aggregateVersion: nextVersion,
    // [R8] Forward traceId to ScheduleAssigned event for end-to-end trace propagation.
    ...(opts.traceId ? { traceId: opts.traceId } : {}),
  });

  return { outcome: 'confirmed', scheduleItemId };
}

// =================================================================
// Internal helper
// =================================================================

async function _cancelProposal(
  scheduleItemId: string,
  targetAccountId: string,
  opts: { workspaceId: string; orgId: string; traceId?: string },
  reason: string
): Promise<void> {
  await updateDocument(`orgScheduleProposals/${scheduleItemId}`, {
    status: 'cancelled' satisfies OrgScheduleStatus,
  });

  // Compensating Event (Invariant A5) — discrete recovery; B-track does NOT flow back to A-track.
  await publishOrgEvent('organization:schedule:assignRejected', {
    scheduleItemId,
    orgId: opts.orgId,
    workspaceId: opts.workspaceId,
    targetAccountId,
    reason,
    rejectedAt: new Date().toISOString(),
    // [R8] Forward traceId to compensating event for end-to-end trace propagation.
    ...(opts.traceId ? { traceId: opts.traceId } : {}),
  });
}

// =================================================================
// Domain Service: cancelOrgScheduleProposal
// =================================================================

/**
 * Manually cancels a pending org schedule proposal by HR governance.
 *
 * Distinct from the compensating-event path inside approveOrgScheduleProposal:
 * this is an explicit HR decision to withdraw the proposal without
 * assigning any member.
 *
 * Publishes `organization:schedule:proposalCancelled` (Scheduling Saga, Invariant A5).
 *
 * Invariant #1: only writes to this BC's own aggregate (orgScheduleProposals).
 */
export async function cancelOrgScheduleProposal(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string
): Promise<void> {
  await updateDocument(`orgScheduleProposals/${scheduleItemId}`, {
    status: 'cancelled' satisfies OrgScheduleStatus,
  });

  await publishOrgEvent('organization:schedule:proposalCancelled', {
    scheduleItemId,
    orgId,
    workspaceId,
    cancelledBy,
    cancelledAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
    // [R8] Forward traceId to compensating event for end-to-end trace propagation.
    ...(traceId ? { traceId } : {}),
  });
}

// =================================================================
// Domain Service: completeOrgSchedule
// =================================================================

/**
 * Marks a confirmed schedule assignment as completed.
 *
 * Invariant #15: completed → eligible = true.
 * The `organization:schedule:completed` event published here is consumed by
 * the event funnel which calls both `applyScheduleCompleted` (account-schedule
 * projection) and `updateOrgMemberEligibility(orgId, accountId, true)` to
 * restore the member's eligible flag.
 *
 * Invariant #1: only writes to this BC's own aggregate (orgScheduleProposals).
 */
export async function completeOrgSchedule(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string
): Promise<void> {
  const existing = await getDocument<OrgScheduleProposal>(`orgScheduleProposals/${scheduleItemId}`);
  if (!existing || existing.status !== 'confirmed') {
    throw new Error(
      `completeOrgSchedule: invalid state transition — scheduleItemId "${scheduleItemId}" is "${existing?.status ?? 'not found'}", expected "confirmed".`
    );
  }
  const nextVersion = existing.version + 1;

  await updateDocument(`orgScheduleProposals/${scheduleItemId}`, {
    status: 'completed' satisfies OrgScheduleStatus,
    version: nextVersion,
  });

  await publishOrgEvent('organization:schedule:completed', {
    scheduleItemId,
    workspaceId,
    orgId,
    targetAccountId,
    completedBy,
    completedAt: new Date().toISOString(),
    aggregateVersion: nextVersion,
    // [R8] Forward traceId for end-to-end trace propagation.
    ...(traceId ? { traceId } : {}),
  });
}

// =================================================================
// Domain Service: cancelOrgScheduleAssignment
// =================================================================

/**
 * Cancels a previously confirmed schedule assignment (post-assignment cancellation).
 *
 * Distinct from `cancelOrgScheduleProposal` which operates on proposals that
 * have NOT yet been confirmed. This function handles the case where a confirmed
 * assignment is later withdrawn by HR, restoring the member's eligible flag.
 *
 * Invariant #15: cancelled → eligible = true.
 * Publishes `organization:schedule:assignmentCancelled` consumed by the event
 * funnel which calls `updateOrgMemberEligibility(orgId, accountId, true)`.
 *
 * Invariant #1: only writes to this BC's own aggregate (orgScheduleProposals).
 */
export async function cancelOrgScheduleAssignment(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string
): Promise<void> {
  const existing = await getDocument<OrgScheduleProposal>(`orgScheduleProposals/${scheduleItemId}`);
  if (!existing || existing.status !== 'confirmed') {
    throw new Error(
      `cancelOrgScheduleAssignment: invalid state transition — scheduleItemId "${scheduleItemId}" is "${existing?.status ?? 'not found'}", expected "confirmed".`
    );
  }
  const nextVersion = existing.version + 1;

  await updateDocument(`orgScheduleProposals/${scheduleItemId}`, {
    status: 'assignmentCancelled' satisfies OrgScheduleStatus,
    version: nextVersion,
  });

  await publishOrgEvent('organization:schedule:assignmentCancelled', {
    scheduleItemId,
    workspaceId,
    orgId,
    targetAccountId,
    cancelledBy,
    cancelledAt: new Date().toISOString(),
    aggregateVersion: nextVersion,
    ...(reason ? { reason } : {}),
    // [R8] Forward traceId for end-to-end trace propagation.
    ...(traceId ? { traceId } : {}),
  });
}
