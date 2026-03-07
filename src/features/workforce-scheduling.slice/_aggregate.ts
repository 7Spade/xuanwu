/**
 * workforce-scheduling.slice ??_aggregate.ts
 *
 * organization.schedule Aggregate Root ??manages the Schedule lifecycle:
 *   draft ??proposed ??confirmed | cancelled
 *
 * Per logic-overview.md:
 *   WORKSPACE_OUTBOX ?’|ScheduleProposed（跨層ä?ä»?· saga）| ORGANIZATION_SCHEDULE
 *   ORGANIZATION_SCHEDULE ??ORGANIZATION_EVENT_BUS ??ACCOUNT_NOTIFICATION_ROUTER (FCM Layer 2+)
 *
 * Aggregate lifecycle (state machine):
 *   draft ??proposed ??confirmed ??completed        (normal path)
 *                                 ??assignmentCancelled  (post-approval cancellation)
 *                    ??cancelled                    (proposal rejected / compensating path)
 *
 * Single source of truth: accounts/{orgId}/schedule_items/{scheduleItemId}
 * The workspace layer creates the document; this aggregate enriches and transitions it.
 *
 * Invariants respected:
 *   #1  ??This BC only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 *   #2  ??Reads workspace schedule data only via the event payload (not domain model).
 *   #4a ??Domain Events produced by ORGANIZATION_SCHEDULE aggregate only.
 *   #4b ??Transaction Runner only delivers to Outbox; does not produce Domain Events.
 *   #12 ??Tier is NEVER stored. Only xp is persisted; getTier(xp) is computed at runtime.
 *   #14 ??Schedule reads ONLY projection.org-eligible-member-view, never Account aggregate.
 *   A5  ??ScheduleAssignRejected is the compensating event when skill validation fails.
 */

import { publishOrgEvent } from '@/features/organization.slice';
import { getOrgMemberEligibility } from '@/features/projection.bus';
import { resolveSkillTier, tierSatisfies } from '@/shared-kernel';
import type { WorkspaceScheduleProposedPayload, SkillRequirement } from '@/shared-kernel';
import type { ScheduleItem, ScheduleStatus } from '@/shared-kernel';
import { getDocument, Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';

import {
  type ScheduleApprovalResult,
  type WriteOp,
} from './_aggregate.types';

export { ORG_SCHEDULE_STATUSES, orgScheduleProposalSchema } from './_aggregate.types';
export type {
  OrgScheduleProposal,
  OrgScheduleStatus,
  ScheduleApprovalResult,
  WriteOp,
} from './_aggregate.types';

// =================================================================
// Aggregate State (DDD state machine)
// =================================================================

/**
 * Aggregate lifecycle states for organization.schedule.
 *
 *   draft               ??initial state; exists only in memory / not yet persisted
 *   proposed            ??received from workspace layer; persisted, awaiting org approval
 *   confirmed           ??skill check passed; ScheduleAssigned event published
 *   cancelled           ??skill check failed or manually cancelled; ScheduleAssignRejected published
 *   completed           ??assignment successfully fulfilled; ScheduleCompleted event published
 *   assignmentCancelled ??confirmed assignment withdrawn post-approval; ScheduleAssignmentCancelled event published
 *
 * These domain states map to ScheduleStatus as follows:
 *   proposed            ??PROPOSAL
 *   confirmed           ??OFFICIAL
 *   cancelled           ??REJECTED
 *   completed           ??COMPLETED
 *   assignmentCancelled ??REJECTED
 */
/** Firestore path for a schedule item (single source of truth). */
function scheduleItemPath(orgId: string, scheduleItemId: string): string {
  return `accounts/${orgId}/schedule_items/${scheduleItemId}`;
}

// =================================================================
// Domain Service: handleScheduleProposed
// =================================================================

/**
 * Handles a ScheduleProposed cross-layer event arriving from WORKSPACE_OUTBOX.
 *
 * The workspace layer already created the accounts/{orgId}/schedule_items document.
 * This function enriches it with org-domain fields (version, traceId, proposedBy,
 * skill requirements) so the org governance layer has all necessary context.
 *
 * Does NOT immediately assign ??assignment requires explicit governance approval
 * via approveOrgScheduleProposal().
 *
 * [D3] Returns a WriteOp ??the caller must execute `updateDocument(op.path, op.data)`.
 */
export function handleScheduleProposed(
  payload: WorkspaceScheduleProposedPayload
): WriteOp {
  return {
    path: scheduleItemPath(payload.orgId, payload.scheduleItemId),
    data: {
      proposedBy: payload.proposedBy,
      version: 1,
      ...(payload.traceId ? { traceId: payload.traceId } : {}),
      ...(payload.skillRequirements?.length ? { requiredSkills: payload.skillRequirements } : {}),
      ...(payload.locationId ? { locationId: payload.locationId } : {}),
    },
  };
}

// =================================================================
// Domain Service: approveOrgScheduleProposal
// =================================================================

/**
 * Result type for approveOrgScheduleProposal ??enables callers to handle
 * both outcomes without catching exceptions (Compensating Event pattern).
 *
 * [D3] Each outcome carries a `writeOp` the caller must execute via `updateDocument`.
 */
/**
 * Called by org-layer governance when a pending proposal should be assigned.
 *
 * Skill Validation (Invariant #14 + #12):
 *   1. Reads projection.org-eligible-member-view (never Account aggregate).
 *   2. For each SkillRequirement, derives tier via resolveSkillTier(xp) ??NOT from DB.
 *   3. If all requirements are met ??confirms and publishes `organization:schedule:assigned`.
 *   4. If any requirement fails ??cancels and publishes `organization:schedule:assignRejected`
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
      const writeOp = await _buildCancelWriteOp(scheduleItemId, targetAccountId, opts, reason);
      return { outcome: 'rejected', scheduleItemId, reason, writeOp };
    }

    // Validate each skill requirement ??tier derived via getTier(xp), never from DB (Invariant #12)
    for (const req of skillRequirements) {
      const skillEntry = memberView.skills[req.tagSlug];

      if (!skillEntry) {
        const reason = `Skill "${req.tagSlug}" is not present in the member's skill projection.`;
        const writeOp = await _buildCancelWriteOp(scheduleItemId, targetAccountId, opts, reason);
        return { outcome: 'rejected', scheduleItemId, reason, writeOp };
      }

      const memberTier = resolveSkillTier(skillEntry.xp);

      if (!tierSatisfies(memberTier, req.minimumTier)) {
        const reason =
          `Skill "${req.tagSlug}" requires tier "${req.minimumTier}" ` +
          `but member has tier "${memberTier}" (xp=${skillEntry.xp}).`;
        const writeOp = await _buildCancelWriteOp(scheduleItemId, targetAccountId, opts, reason);
        return { outcome: 'rejected', scheduleItemId, reason, writeOp };
      }
    }
  }

  // --- All checks passed ??Confirm ---
  // Read current version and increment to ensure proper aggregateVersion for ELIGIBLE_UPDATE_GUARD [R7]
  const existing = await getDocument<ScheduleItem>(scheduleItemPath(opts.orgId, scheduleItemId));
  const nextVersion = (existing?.version ?? 1) + 1;

  // [D3] Return WriteOp ??caller executes updateDocument(writeOp.path, writeOp.data)
  const writeOp: WriteOp = {
    path: scheduleItemPath(opts.orgId, scheduleItemId),
    data: {
      status: 'OFFICIAL' satisfies ScheduleStatus,
      version: nextVersion,
    },
    arrayUnionFields: { assigneeIds: [targetAccountId] },
  };

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

  return { outcome: 'confirmed', scheduleItemId, writeOp };
}

// =================================================================
// Internal helper
// =================================================================

/**
 * Builds the WriteOp for cancelling a proposal and publishes the compensating event.
 *
 * [D3] Does NOT call updateDocument ??returns WriteOp for the caller to execute.
 */
async function _buildCancelWriteOp(
  scheduleItemId: string,
  targetAccountId: string,
  opts: { workspaceId: string; orgId: string; traceId?: string },
  reason: string
): Promise<WriteOp> {
  // Compensating Event (Invariant A5) ??discrete recovery; B-track does NOT flow back to A-track.
  await publishOrgEvent('organization:schedule:assignRejected', {
    scheduleItemId,
    orgId: opts.orgId,
    workspaceId: opts.workspaceId,
    targetAccountId,
    reason,
    rejectedAt: Timestamp.now().toDate().toISOString(),
    // [R8] Forward traceId to compensating event for end-to-end trace propagation.
    ...(opts.traceId ? { traceId: opts.traceId } : {}),
  });

  return {
    path: scheduleItemPath(opts.orgId, scheduleItemId),
    data: { status: 'REJECTED' satisfies ScheduleStatus },
  };
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
 * Invariant #1: only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 *
 * [D3] Returns a WriteOp ??the caller must execute `updateDocument(op.path, op.data)`.
 */
export async function cancelOrgScheduleProposal(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TraceID propagated from the originating scheduling saga. */
  traceId?: string
): Promise<WriteOp> {
  await publishOrgEvent('organization:schedule:proposalCancelled', {
    scheduleItemId,
    orgId,
    workspaceId,
    cancelledBy,
    cancelledAt: Timestamp.now().toDate().toISOString(),
    ...(reason ? { reason } : {}),
    // [R8] Forward traceId to compensating event for end-to-end trace propagation.
    ...(traceId ? { traceId } : {}),
  });

  return {
    path: scheduleItemPath(orgId, scheduleItemId),
    data: { status: 'REJECTED' satisfies ScheduleStatus },
  };
}

// =================================================================
// Domain Service: completeOrgSchedule
// =================================================================

/**
 * Marks a confirmed schedule assignment as completed.
 *
 * Invariant #15: completed ??eligible = true.
 * The `organization:schedule:completed` event published here is consumed by
 * the event funnel which calls both `applyScheduleCompleted` (account-schedule
 * projection) and `updateOrgMemberEligibility(orgId, accountId, true)` to
 * restore the member's eligible flag.
 *
 * Invariant #1: only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 *
 * [D3] Returns a WriteOp ??the caller must execute `updateDocument(op.path, op.data)`.
 */
export async function completeOrgSchedule(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  /** [R8] TraceID propagated from the originating command. */
  traceId?: string
): Promise<WriteOp> {
  const existing = await getDocument<ScheduleItem>(scheduleItemPath(orgId, scheduleItemId));
  if (!existing || existing.status !== 'OFFICIAL') {
    throw new Error(
      `completeOrgSchedule: invalid state transition ??scheduleItemId "${scheduleItemId}" is "${existing?.status ?? 'not found'}", expected "OFFICIAL".`
    );
  }
  const nextVersion = (existing.version ?? 1) + 1;

  await publishOrgEvent('organization:schedule:completed', {
    scheduleItemId,
    workspaceId,
    orgId,
    targetAccountId,
    completedBy,
    completedAt: Timestamp.now().toDate().toISOString(),
    aggregateVersion: nextVersion,
    // [R8] Forward traceId for end-to-end trace propagation.
    ...(traceId ? { traceId } : {}),
  });

  return {
    path: scheduleItemPath(orgId, scheduleItemId),
    data: {
      status: 'COMPLETED' satisfies ScheduleStatus,
      version: nextVersion,
    },
  };
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
 * Invariant #15: cancelled ??eligible = true.
 * Publishes `organization:schedule:assignmentCancelled` consumed by the event
 * funnel which calls `updateOrgMemberEligibility(orgId, accountId, true)`.
 *
 * Invariant #1: only writes to accounts/{orgId}/schedule_items (ScheduleItem SSOT).
 *
 * [D3] Returns a WriteOp ??the caller must execute `updateDocument(op.path, op.data)`.
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
): Promise<WriteOp> {
  const existing = await getDocument<ScheduleItem>(scheduleItemPath(orgId, scheduleItemId));
  if (!existing || existing.status !== 'OFFICIAL') {
    throw new Error(
      `cancelOrgScheduleAssignment: invalid state transition ??scheduleItemId "${scheduleItemId}" is "${existing?.status ?? 'not found'}", expected "OFFICIAL".`
    );
  }
  const nextVersion = (existing.version ?? 1) + 1;

  await publishOrgEvent('organization:schedule:assignmentCancelled', {
    scheduleItemId,
    workspaceId,
    orgId,
    targetAccountId,
    cancelledBy,
    cancelledAt: Timestamp.now().toDate().toISOString(),
    aggregateVersion: nextVersion,
    ...(reason ? { reason } : {}),
    // [R8] Forward traceId for end-to-end trace propagation.
    ...(traceId ? { traceId } : {}),
  });

  return {
    path: scheduleItemPath(orgId, scheduleItemId),
    data: {
      status: 'REJECTED' satisfies ScheduleStatus,
      version: nextVersion,
    },
  };
}
