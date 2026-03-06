'use server';

/**
 * Module: governance.ts
 * Purpose: Governance and HR domain actions.
 * Responsibilities: manual assign validation flow, cancel proposal, complete schedule
 * Constraints: deterministic logic, respect module boundaries
 */

import {
  type CommandResult,
  type SkillRequirement,
  commandFailureFrom,
  commandSuccess,
} from '@/shared-kernel';

import {
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
} from '../_aggregate';
import { executeWriteOp } from '../_write-op';

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

    await executeWriteOp(result.writeOp);

    if (result.outcome === 'confirmed') {
      return commandSuccess(result.scheduleItemId, Date.now());
    }

    return commandFailureFrom('SCHEDULE_ASSIGN_REJECTED', result.reason);
  } catch (error) {
    return commandFailureFrom('SCHEDULE_ASSIGN_FAILED', error instanceof Error ? error.message : String(error));
  }
}

export async function cancelScheduleProposalAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<CommandResult> {
  try {
    const writeOp = await cancelOrgScheduleProposal(scheduleItemId, orgId, workspaceId, cancelledBy, reason, traceId);
    await executeWriteOp(writeOp);
    return commandSuccess(scheduleItemId, Date.now());
  } catch (error) {
    return commandFailureFrom('SCHEDULE_PROPOSAL_CANCEL_FAILED', error instanceof Error ? error.message : String(error));
  }
}

export async function completeOrgScheduleAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  traceId?: string
): Promise<CommandResult> {
  try {
    const writeOp = await completeOrgSchedule(scheduleItemId, orgId, workspaceId, targetAccountId, completedBy, traceId);
    await executeWriteOp(writeOp);
    return commandSuccess(scheduleItemId, Date.now());
  } catch (error) {
    return commandFailureFrom('SCHEDULE_COMPLETE_FAILED', error instanceof Error ? error.message : String(error));
  }
}
