/**
 * scheduling.slice/_projectors — demand-board.ts
 *
 * Maintains the Demand Board read model.
 * Per docs/prd-schedule-workforce-skills.md FR-W0 / FR-W6:
 *   - PROPOSAL: proposal submitted, awaiting assignment (visible)
 *   - OFFICIAL: member confirmed (visible with assignee details)
 *   - REJECTED / COMPLETED: closed (hidden from default board view)
 *
 * Single source of truth: accounts/{orgId}/schedule_items/{scheduleItemId}
 * All projector functions write to this path (same document the workspace and
 * domain layers create/enrich), ensuring the UI always reads from one collection.
 *
 * Governance rules applied here:
 *   [S2] SK_VERSION_GUARD — versionGuardAllows enforced before every Firestore write.
 *   [R8] traceId — persisted from originating EventEnvelope.
 *   PROJ_STALE_DEMAND_BOARD ≤ 5s (SK_STALENESS_CONTRACT).
 *
 * Invariant #1 (cross-BC): this projector only writes to accounts/{orgId}/schedule_items
 *   — the ScheduleItem SSOT. It does NOT write to any other BC's aggregate.
 */

import { updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { arrayUnion } from 'firebase/firestore';
import { versionGuardAllows } from '@/features/shared.kernel.version-guard';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared.kernel.skill-tier';
import type {
  ScheduleAssignedPayload,
  ScheduleCompletedPayload,
  ScheduleAssignmentCancelledPayload,
  ScheduleProposalCancelledPayload,
  ScheduleAssignRejectedPayload,
} from '@/features/account-organization.event-bus';

/** Firestore path for a schedule item (single source of truth). */
function scheduleItemPath(orgId: string, scheduleItemId: string): string {
  return `accounts/${orgId}/schedule_items/${scheduleItemId}`;
}

/** Initial version for newly proposed schedule items. */
const DEMAND_INITIAL_VERSION = 1;

/**
 * Called by projection.event-funnel on 'workspace:schedule:proposed'.
 *
 * The workspace layer already created the accounts/{orgId}/schedule_items document.
 * handleScheduleProposed (domain aggregate) also runs before this function and
 * sets version/traceId. This function is idempotent — if the domain already set
 * version=1, the version guard on subsequent projector functions will naturally
 * skip stale writes.
 *
 * [S2] No version guard on initial insert (create-or-overwrite is idempotent).
 */
export async function applyDemandProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void> {
  // The document already exists (created by workspace layer + enriched by domain).
  // We ensure version/traceId are set so downstream version guards work correctly.
  await updateDocument(scheduleItemPath(payload.orgId, payload.scheduleItemId), {
    version: DEMAND_INITIAL_VERSION,
    ...(payload.traceId ? { traceId: payload.traceId } : {}),
  });
}

/**
 * Marks a schedule item as assigned (OFFICIAL).
 * Called by projection.event-funnel on 'organization:schedule:assigned'.
 *
 * Note: approveOrgScheduleProposal (domain) sets status='OFFICIAL' and increments
 * version BEFORE publishing this event. The version guard therefore naturally skips
 * this write when the domain has already applied the update (nextVersion == existing.version).
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandAssigned(payload: ScheduleAssignedPayload): Promise<void> {
  const path = scheduleItemPath(payload.orgId, payload.scheduleItemId);
  const existing = await getDocument<ScheduleItem>(path);
  if (
    !versionGuardAllows({
      eventVersion: payload.aggregateVersion,
      viewLastProcessedVersion: existing?.version ?? 0,
    })
  ) {
    return;
  }
  await updateDocument(path, {
    status: 'OFFICIAL' satisfies ScheduleStatus,
    assigneeIds: arrayUnion(payload.targetAccountId),
    version: payload.aggregateVersion,
    ...(payload.traceId ? { traceId: payload.traceId } : {}),
  });
}

/**
 * Marks a schedule item as completed (COMPLETED).
 * Called by projection.event-funnel on 'organization:schedule:completed'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandCompleted(payload: ScheduleCompletedPayload): Promise<void> {
  await _closeScheduleItem(
    payload.orgId,
    payload.scheduleItemId,
    'COMPLETED',
    payload.aggregateVersion,
    payload.traceId
  );
}

/**
 * Marks a schedule item as rejected due to assignment cancellation (REJECTED).
 * Called by projection.event-funnel on 'organization:schedule:assignmentCancelled'.
 * [S2] versionGuardAllows enforced before write.
 */
export async function applyDemandAssignmentCancelled(
  payload: ScheduleAssignmentCancelledPayload
): Promise<void> {
  await _closeScheduleItem(
    payload.orgId,
    payload.scheduleItemId,
    'REJECTED',
    payload.aggregateVersion,
    payload.traceId
  );
}

/**
 * Marks a schedule item as rejected due to proposal cancellation (REJECTED).
 * Called by projection.event-funnel on 'organization:schedule:proposalCancelled'.
 * [S2] No aggregateVersion in this payload — guard via status: skip if already closed.
 */
export async function applyDemandProposalCancelled(
  payload: ScheduleProposalCancelledPayload
): Promise<void> {
  const path = scheduleItemPath(payload.orgId, payload.scheduleItemId);
  const existing = await getDocument<ScheduleItem>(path);
  // [S2] Status-based guard: skip if item is already in a terminal state.
  if (!existing || existing.status === 'REJECTED' || existing.status === 'COMPLETED') {
    return;
  }
  await updateDocument(path, {
    status: 'REJECTED' satisfies ScheduleStatus,
    ...(payload.traceId ? { traceId: payload.traceId } : {}),
  });
}

/**
 * Marks a schedule item as rejected due to skill validation failure (REJECTED).
 * Called by projection.event-funnel on 'organization:schedule:assignRejected'.
 * [S2] No aggregateVersion in this payload — guard via status: skip if already closed.
 */
export async function applyDemandAssignRejected(
  payload: ScheduleAssignRejectedPayload
): Promise<void> {
  const path = scheduleItemPath(payload.orgId, payload.scheduleItemId);
  const existing = await getDocument<ScheduleItem>(path);
  // [S2] Status-based guard: skip if item is already in a terminal state.
  if (!existing || existing.status === 'REJECTED' || existing.status === 'COMPLETED') {
    return;
  }
  await updateDocument(path, {
    status: 'REJECTED' satisfies ScheduleStatus,
    ...(payload.traceId ? { traceId: payload.traceId } : {}),
  });
}

// =================================================================
// Internal helper
// =================================================================

async function _closeScheduleItem(
  orgId: string,
  scheduleItemId: string,
  status: 'COMPLETED' | 'REJECTED',
  aggregateVersion: number,
  traceId?: string
): Promise<void> {
  const path = scheduleItemPath(orgId, scheduleItemId);
  const existing = await getDocument<ScheduleItem>(path);
  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.version ?? 0,
    })
  ) {
    return;
  }
  await updateDocument(path, {
    status: status satisfies ScheduleStatus,
    version: aggregateVersion,
    ...(traceId ? { traceId } : {}),
  });
}
