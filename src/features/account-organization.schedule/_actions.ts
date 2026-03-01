'use server';

/**
 * account-organization.schedule — _actions.ts
 *
 * Server Actions for the HR Schedule Management domain.
 * These are the A-Track command entry points for schedule lifecycle.
 *
 * Per GEMINI.md §1.3 SK_CMD_RESULT [R4]:
 *   All exports MUST return CommandResult.
 *
 * Per GEMINI.md §1.1 TRACE_PROPAGATION_RULE [R8]:
 *   traceId must NOT be regenerated here — it is threaded from the
 *   originating CBG_ENTRY (workspace-provider.tsx or equivalent).
 *
 * FR-W6: "Manual Assign" — HR can assign any eligible member to an
 *   open demand, bypassing the automatic skill-tier check if override is set.
 *   Critical Gap #0 from docs/prd-schedule-workforce-skills.md v1.1.
 */

import { approveOrgScheduleProposal, cancelOrgScheduleProposal, completeOrgSchedule } from './_schedule';
import {
  assignMemberAndApprove,
  updateScheduleItemStatus as updateScheduleItemStatusRepo,
} from '@/shared/infra/firestore/firestore.facade';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';
import type { SkillRequirement } from '@/features/shared.kernel.skill-tier';

// =================================================================
// Lightweight facade-level schedule item mutations
// (Used by OrgScheduleGovernance — no domain-logic pass-through required)
// =================================================================

/**
 * Assigns a member to a schedule item and marks it OFFICIAL in one write.
 *
 * This is the "fast path" used by the HR governance UI when the actor
 * has already validated skill eligibility via the org-eligible-member-view
 * projection (FR-W2). It does not re-run domain-level skill-tier checks.
 *
 * Use manualAssignScheduleMember when you need the full domain validation.
 *
 * @param organizationId - The org account ID owning the schedule item.
 * @param itemId         - The schedule item document ID.
 * @param memberId       - The account ID of the member to assign.
 */
export async function approveScheduleItemWithMember(
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await assignMemberAndApprove(organizationId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'APPROVE_SCHEDULE_ITEM_FAILED',
      err instanceof Error ? err.message : 'Failed to approve schedule item'
    );
  }
}

/**
 * Updates the status of a schedule item (OFFICIAL | REJECTED | COMPLETED).
 *
 * Used by the HR governance UI to reject proposals or mark items completed
 * without re-running the full domain lifecycle (which requires saga/event context).
 *
 * For the full domain-validated complete flow, use completeOrgScheduleAction.
 *
 * @param organizationId - The org account ID owning the schedule item.
 * @param itemId         - The schedule item document ID.
 * @param newStatus      - The target status:
 *   - `OFFICIAL`   → confirm the proposal (normally done via approveScheduleItemWithMember)
 *   - `REJECTED`   → cancel/reject a PROPOSAL before it is assigned
 *   - `COMPLETED`  → mark an OFFICIAL assignment as done (FR-S6)
 */
export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<CommandResult> {
  try {
    await updateScheduleItemStatusRepo(organizationId, itemId, newStatus);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'UPDATE_SCHEDULE_ITEM_STATUS_FAILED',
      err instanceof Error ? err.message : 'Failed to update schedule item status'
    );
  }
}

// =================================================================
// FR-W6 — Manual Assignment (Critical Gap #0)
// =================================================================

/**
 * HR manually assigns a member to an open demand (schedule proposal).
 *
 * Per docs/prd-schedule-workforce-skills.md V1.0 milestone:
 *   Manual assignment first — allows HR to assign any eligible member,
 *   respecting BR-D2 (member must be eligible), BR-D3 (no double-booking),
 *   BR-D4 (skill tier validation via org-eligible-member-view projection).
 *
 * [R8] traceId threaded from the originating workspace proposal.
 */
export async function manualAssignScheduleMember(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    /** [R8] TRACE_PROPAGATION_RULE: traceId from originating CBG_ENTRY. */
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<CommandResult> {
  try {
    const result = await approveOrgScheduleProposal(
      scheduleItemId,
      targetAccountId,
      assignedBy,
      opts,
      skillRequirements
    );

    if (result.outcome === 'confirmed') {
      return commandSuccess(result.scheduleItemId, Date.now());
    }
    // outcome === 'rejected'
    return commandFailureFrom(
      'SCHEDULE_ASSIGN_REJECTED',
      result.reason
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('SCHEDULE_ASSIGN_FAILED', message);
  }
}

// =================================================================
// Proposal Cancellation
// =================================================================

/**
 * HR cancels a pending schedule proposal (removes it from the demand board).
 */
export async function cancelScheduleProposalAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TRACE_PROPAGATION_RULE: traceId from originating CBG_ENTRY. */
  traceId?: string
): Promise<CommandResult> {
  try {
    await cancelOrgScheduleProposal(scheduleItemId, orgId, workspaceId, cancelledBy, reason, traceId);
    return commandSuccess(scheduleItemId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('SCHEDULE_PROPOSAL_CANCEL_FAILED', message);
  }
}

// =================================================================
// FR-S6 — Complete Schedule (confirmed → completed)
// =================================================================

/**
 * HR marks a confirmed schedule assignment as completed.
 *
 * Invariant #15: completed → member's eligible flag restored to true.
 * [R8] traceId threaded from the originating command.
 */
export async function completeOrgScheduleAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  /** [R8] TRACE_PROPAGATION_RULE: traceId from originating CBG_ENTRY. */
  traceId?: string
): Promise<CommandResult> {
  try {
    await completeOrgSchedule(
      scheduleItemId,
      orgId,
      workspaceId,
      targetAccountId,
      completedBy,
      traceId
    );
    return commandSuccess(scheduleItemId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('SCHEDULE_COMPLETE_FAILED', message);
  }
}
