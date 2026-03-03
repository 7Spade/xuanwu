'use server';

/**
 * scheduling.slice — _actions.ts
 *
 * Server Actions for the VS6 Scheduling domain.
 *
 * Per GEMINI.md §1.3 SK_CMD_RESULT [R4]:
 *   All exports MUST return CommandResult.
 *
 * Per GEMINI.md §1.1 TRACE_PROPAGATION_RULE [R8]:
 *   traceId must NOT be regenerated here — threaded from CBG_ENTRY.
 *
 * Sections:
 *   A. Workspace-level mutations (createScheduleItem, assignMember, unassignMember)
 *   B. Lightweight facade mutations (approveScheduleItemWithMember, updateScheduleItemStatus)
 *   C. HR domain actions (manualAssignScheduleMember, cancelScheduleProposalAction, completeOrgScheduleAction)
 */

import {
  type CommandResult,
  type SkillRequirement,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import {
  assignMemberToScheduleItem,
  unassignMemberFromScheduleItem,
  createScheduleItem as createScheduleItemFacade,
  updateScheduleItemStatus as updateScheduleItemStatusFacade,
  assignMemberAndApprove,
} from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import { updateDocument, arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';

import {
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
  type WriteOp,
} from './_aggregate';

// ---------------------------------------------------------------------------
// Internal: executes a WriteOp returned by an aggregate function. [D3]
// ---------------------------------------------------------------------------
async function executeWriteOp(op: WriteOp): Promise<void> {
  const data: Record<string, unknown> = { ...op.data };
  for (const [field, values] of Object.entries(op.arrayUnionFields ?? {})) {
    data[field] = arrayUnion(...values);
  }
  await updateDocument(op.path, data);
}

// =================================================================
// A. Workspace-level mutations
// =================================================================

export async function createScheduleItem(
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<CommandResult> {
  try {
    const now = Timestamp.now();
    const data: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'> = {
      ...itemData,
      startDate: itemData.startDate ? Timestamp.fromDate(itemData.startDate) : now,
      endDate: itemData.endDate ? Timestamp.fromDate(itemData.endDate) : now,
    };
    const id = await createScheduleItemFacade(data);
    return commandSuccess(id, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'CREATE_SCHEDULE_ITEM_FAILED',
      err instanceof Error ? err.message : 'Failed to create schedule item'
    );
  }
}

export async function assignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await assignMemberToScheduleItem(accountId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'ASSIGN_MEMBER_TO_SCHEDULE_FAILED',
      err instanceof Error ? err.message : 'Failed to assign member to schedule item'
    );
  }
}

export async function unassignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await unassignMemberFromScheduleItem(accountId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'UNASSIGN_MEMBER_FROM_SCHEDULE_FAILED',
      err instanceof Error ? err.message : 'Failed to unassign member from schedule item'
    );
  }
}

// =================================================================
// B. Lightweight facade mutations (fast path for HR governance UI)
// =================================================================

/**
 * Assigns a member to a schedule item and marks it OFFICIAL in one write.
 * Fast path: no domain-level skill-tier re-check. Use manualAssignScheduleMember
 * for the full validation flow.
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
 * Updates the approval status of a schedule item (OFFICIAL | REJECTED | COMPLETED).
 */
export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<CommandResult> {
  try {
    await updateScheduleItemStatusFacade(organizationId, itemId, newStatus);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      'UPDATE_SCHEDULE_ITEM_STATUS_FAILED',
      err instanceof Error ? err.message : 'Failed to update schedule item status'
    );
  }
}

// =================================================================
// C. HR domain actions (FR-W6, FR-S6)
// =================================================================

/**
 * FR-W6: HR manually assigns a member to an open demand.
 * Runs the full domain-level skill-tier check via approveOrgScheduleProposal.
 * [R8] traceId threaded from the originating CBG_ENTRY.
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
    // [D3] Execute the write returned by the aggregate.
    await executeWriteOp(result.writeOp);
    if (result.outcome === 'confirmed') {
      return commandSuccess(result.scheduleItemId, Date.now());
    }
    return commandFailureFrom('SCHEDULE_ASSIGN_REJECTED', result.reason);
  } catch (err) {
    return commandFailureFrom('SCHEDULE_ASSIGN_FAILED', err instanceof Error ? err.message : String(err));
  }
}

/**
 * HR cancels a pending schedule proposal.
 * [R8] traceId threaded from originating CBG_ENTRY.
 */
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
    // [D3] Execute the write returned by the aggregate.
    await executeWriteOp(writeOp);
    return commandSuccess(scheduleItemId, Date.now());
  } catch (err) {
    return commandFailureFrom('SCHEDULE_PROPOSAL_CANCEL_FAILED', err instanceof Error ? err.message : String(err));
  }
}

/**
 * FR-S6: HR marks a confirmed schedule assignment as completed.
 * Invariant #15: member eligible flag restored to true.
 * [R8] traceId threaded from originating CBG_ENTRY.
 */
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
    // [D3] Execute the write returned by the aggregate.
    await executeWriteOp(writeOp);
    return commandSuccess(scheduleItemId, Date.now());
  } catch (err) {
    return commandFailureFrom('SCHEDULE_COMPLETE_FAILED', err instanceof Error ? err.message : String(err));
  }
}
