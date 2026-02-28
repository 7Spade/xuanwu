/**
 * projection.demand-board — _projector.ts
 *
 * Maintains the Demand Board read model.
 * Per docs/prd-schedule-workforce-skills.md FR-W0 / FR-W6:
 *   - open: proposal submitted, awaiting assignment (visible)
 *   - assigned: member confirmed (visible with assignee details)
 *   - closed: completed / cancelled / rejected (hidden from default board view)
 *
 * Stored at: orgDemandBoard/{orgId}/demands/{scheduleItemId}
 *
 * Governance rules applied here:
 *   [S2] SK_VERSION_GUARD — versionGuardAllows enforced before every Firestore write.
 *   [R8] traceId — persisted from originating EventEnvelope.
 *   PROJ_STALE_DEMAND_BOARD ≤ 5s (SK_STALENESS_CONTRACT).
 *
 * Invariant #1 (cross-BC): this projector only writes to orgDemandBoard — it does NOT
 *   write to any other BC's aggregate.
 */

import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { versionGuardAllows } from '@/features/shared.kernel.version-guard';
import type { ScheduleDemand, ScheduleDemandStatus, ScheduleDemandCloseReason } from '@/shared/types';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared.kernel.skill-tier';
import type {
  ScheduleAssignedPayload,
  ScheduleCompletedPayload,
  ScheduleAssignmentCancelledPayload,
  ScheduleProposalCancelledPayload,
  ScheduleAssignRejectedPayload,
} from '@/features/account-organization.event-bus';

/** Firestore path for a demand document. */
function demandPath(orgId: string, scheduleItemId: string): string {
  return `orgDemandBoard/${orgId}/demands/${scheduleItemId}`;
}

/** Initial lastProcessedVersion for newly created demand documents. */
const DEMAND_INITIAL_VERSION = 1;

/**
 * Upserts an open demand when a schedule proposal arrives.
 * Called by projection.event-funnel on 'workspace:schedule:proposed'.
 * [S2] No version guard on initial insert (create-or-overwrite is idempotent).
 */
export async function applyDemandProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void> {
  const demand: ScheduleDemand = {
    scheduleItemId: payload.scheduleItemId,
    orgId: payload.orgId,
    workspaceId: payload.workspaceId,
    workspaceName: payload.workspaceName,
    title: payload.title,
    startDate: payload.startDate,
    endDate: payload.endDate,
    proposedBy: payload.proposedBy,
    status: 'open',
    requiredSkills: payload.skillRequirements,
    locationId: payload.locationId,
    lastProcessedVersion: DEMAND_INITIAL_VERSION,
    traceId: payload.traceId,
    updatedAt: new Date().toISOString(),
  };
  await setDocument(demandPath(payload.orgId, payload.scheduleItemId), demand);
}

/**
 * Marks a demand as assigned.
 * Called by projection.event-funnel on 'organization:schedule:assigned'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandAssigned(payload: ScheduleAssignedPayload): Promise<void> {
  const path = demandPath(payload.orgId, payload.scheduleItemId);
  const existing = await getDocument<ScheduleDemand>(path);
  if (
    !versionGuardAllows({
      eventVersion: payload.aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }
  await updateDocument(path, {
    status: 'assigned' as ScheduleDemandStatus,
    assignedMemberId: payload.targetAccountId,
    lastProcessedVersion: payload.aggregateVersion,
    traceId: payload.traceId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Marks a demand as closed with reason 'completed'.
 * Called by projection.event-funnel on 'organization:schedule:completed'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandCompleted(payload: ScheduleCompletedPayload): Promise<void> {
  await _closeDemand(
    payload.orgId,
    payload.scheduleItemId,
    'completed',
    payload.aggregateVersion,
    payload.traceId
  );
}

/**
 * Marks a demand as closed with reason 'assignmentCancelled'.
 * Called by projection.event-funnel on 'organization:schedule:assignmentCancelled'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandAssignmentCancelled(
  payload: ScheduleAssignmentCancelledPayload
): Promise<void> {
  await _closeDemand(
    payload.orgId,
    payload.scheduleItemId,
    'assignmentCancelled',
    payload.aggregateVersion,
    payload.traceId
  );
}

/**
 * Marks a demand as closed with reason 'proposalCancelled'.
 * Called by projection.event-funnel on 'organization:schedule:proposalCancelled'.
 * [S2] No aggregateVersion in this payload — guard via status: skip if already closed.
 */
export async function applyDemandProposalCancelled(
  payload: ScheduleProposalCancelledPayload
): Promise<void> {
  const path = demandPath(payload.orgId, payload.scheduleItemId);
  const existing = await getDocument<ScheduleDemand>(path);
  // [S2] Status-based guard: idempotent — skip if demand is already closed.
  if (!existing || existing.status === 'closed') {
    return;
  }
  await updateDocument(path, {
    status: 'closed' as ScheduleDemandStatus,
    closeReason: 'proposalCancelled' as ScheduleDemandCloseReason,
    traceId: payload.traceId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Marks a demand as closed with reason 'assignRejected'.
 * Called by projection.event-funnel on 'organization:schedule:assignRejected'.
 * [S2] No aggregateVersion in this payload — guard via status: skip if already closed.
 */
export async function applyDemandAssignRejected(
  payload: ScheduleAssignRejectedPayload
): Promise<void> {
  const path = demandPath(payload.orgId, payload.scheduleItemId);
  const existing = await getDocument<ScheduleDemand>(path);
  // [S2] Status-based guard: idempotent — skip if demand is already closed.
  if (!existing || existing.status === 'closed') {
    return;
  }
  await updateDocument(path, {
    status: 'closed' as ScheduleDemandStatus,
    closeReason: 'assignRejected' as ScheduleDemandCloseReason,
    traceId: payload.traceId,
    updatedAt: new Date().toISOString(),
  });
}

// =================================================================
// Internal helper
// =================================================================

async function _closeDemand(
  orgId: string,
  scheduleItemId: string,
  closeReason: ScheduleDemandCloseReason,
  aggregateVersion: number,
  traceId?: string
): Promise<void> {
  const path = demandPath(orgId, scheduleItemId);
  const existing = await getDocument<ScheduleDemand>(path);
  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }
  await updateDocument(path, {
    status: 'closed' as ScheduleDemandStatus,
    closeReason,
    lastProcessedVersion: aggregateVersion,
    traceId,
    updatedAt: new Date().toISOString(),
  });
}

// Re-export types for convenience
export type { ScheduleDemand, ScheduleDemandCloseReason };
