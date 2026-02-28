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

import { approveOrgScheduleProposal, cancelOrgScheduleProposal, cancelOrgScheduleAssignment, completeOrgSchedule } from './_schedule';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';
import type { SkillRequirement } from '@/features/shared.kernel.skill-tier';

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
    /** AccountId of the workspace scheduler who submitted the proposal (FR-N2). */
    proposedBy?: string;
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
// FR-S7 — Cancel Assignment (confirmed → assignmentCancelled)
// =================================================================

/**
 * HR cancels a previously confirmed schedule assignment.
 *
 * Distinct from `cancelScheduleProposalAction` (which operates on proposals
 * that have not yet been confirmed). This action handles post-assignment
 * withdrawal, restoring the member's eligible flag.
 *
 * [R8] traceId threaded from the originating command.
 */
export async function cancelOrgScheduleAssignmentAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  cancelledBy: string,
  reason?: string,
  /** [R8] TRACE_PROPAGATION_RULE: traceId from originating CBG_ENTRY. */
  traceId?: string
): Promise<CommandResult> {
  try {
    await cancelOrgScheduleAssignment(
      scheduleItemId,
      orgId,
      workspaceId,
      targetAccountId,
      cancelledBy,
      reason,
      traceId
    );
    return commandSuccess(scheduleItemId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('SCHEDULE_ASSIGNMENT_CANCEL_FAILED', message);
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
