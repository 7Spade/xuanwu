/**
 * scheduling-core.saga — _saga.ts
 *
 * [VS6] 跨組織排班協作 Saga 協調器
 *
 * Per logic-overview_v9.md VS6:
 *   WorkspaceScheduleProposed → OrgEligibilityCheck → ScheduleAssigned
 *
 * State machine:
 *   pending → eligibility_check → assigned | compensated
 *
 * Compensation [A5]: if eligibility check fails, emits ScheduleAssignRejected
 * and transitions the saga to 'compensated'.
 *
 * Persistence: sagaStates/{sagaId} in Firestore.
 */

import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  handleScheduleProposed,
  approveOrgScheduleProposal,
} from '@/features/account-organization.schedule';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared.kernel.skill-tier';
import { getOrgEligibleMembersWithTier } from '@/features/projection.org-eligible-member-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Discrete steps the saga executes in order. */
export type SagaStep =
  | 'receive_proposal'
  | 'eligibility_check'
  | 'assign'
  | 'compensate';

/** Lifecycle states of the saga instance. */
export type SagaStatus =
  | 'pending'
  | 'eligibility_check'
  | 'assigned'
  | 'compensated';

/** Persisted saga state stored in Firestore. */
export interface SagaState {
  readonly sagaId: string;
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  status: SagaStatus;
  currentStep: SagaStep;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  compensationReason?: string;
}

const SAGA_COLLECTION = 'sagaStates';

const TIER_ORDER = [
  'apprentice',
  'journeyman',
  'expert',
  'artisan',
  'grandmaster',
  'legendary',
  'titan',
] as const;

type Tier = (typeof TIER_ORDER)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sagaPath(sagaId: string): string {
  return `${SAGA_COLLECTION}/${sagaId}`;
}

async function persistSaga(state: SagaState): Promise<void> {
  await setDocument(sagaPath(state.sagaId), state);
}

async function updateSagaStatus(
  sagaId: string,
  patch: Partial<
    Pick<
      SagaState,
      'status' | 'currentStep' | 'completedAt' | 'compensationReason' | 'updatedAt'
    >
  >
): Promise<void> {
  await updateDocument(sagaPath(sagaId), { ...patch, updatedAt: new Date().toISOString() });
}

function tierIndex(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier as Tier);
  if (idx === -1) {
    console.warn(`[scheduling-core.saga] Unknown tier value "${tier}", defaulting to 0 (apprentice).`);
    return 0;
  }
  return idx;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a persisted saga state by ID.
 * Returns null if not found.
 */
export async function getSagaState(sagaId: string): Promise<SagaState | null> {
  return getDocument<SagaState>(sagaPath(sagaId));
}

/**
 * Entry point for the VS6 scheduling saga.
 *
 * Called by the OUTBOX_RELAY_WORKER when it picks up a `workspace:schedule:proposed`
 * event from WORKSPACE_OUTBOX. Orchestrates the full saga:
 *
 *   Step 1 — receive_proposal: persist the OrgScheduleProposal
 *   Step 2 — eligibility_check: find the best eligible member [#14][R7]
 *   Step 3 — assign | compensate [A5]
 *
 * @param event   The WorkspaceScheduleProposedPayload cross-BC event.
 * @param sagaId  Caller-assigned idempotency key (`saga:${scheduleItemId}`).
 */
export async function startSchedulingSaga(
  event: WorkspaceScheduleProposedPayload,
  sagaId: string
): Promise<SagaState> {
  const now = new Date().toISOString();

  const existing = await getSagaState(sagaId);
  if (existing) {
    return existing;
  }

  // Step 1 — receive_proposal
  const initialState: SagaState = {
    sagaId,
    scheduleItemId: event.scheduleItemId,
    workspaceId: event.workspaceId,
    orgId: event.orgId,
    status: 'pending',
    currentStep: 'receive_proposal',
    startedAt: now,
    updatedAt: now,
  };
  await persistSaga(initialState);
  await handleScheduleProposed(event);

  // Step 2 — eligibility_check
  await updateSagaStatus(sagaId, {
    status: 'eligibility_check',
    currentStep: 'eligibility_check',
  });

  const eligibleMembers = await getOrgEligibleMembersWithTier(event.orgId);
  // requirements = [] means "any eligible member can be assigned" (no skill filtering)
  const requirements = event.skillRequirements ?? [];

  const candidate = eligibleMembers.find((member) => {
    if (!member.eligible) return false;
    return requirements.every((req) => {
      const skill = member.skills.find((s) => s.skillId === req.tagSlug);
      if (!skill) return false;
      return tierIndex(skill.tier) >= tierIndex(req.minimumTier);
    });
  });

  // Step 3 — assign or compensate [A5]
  if (!candidate) {
    const reason =
      requirements.length > 0
        ? `No eligible member found matching skills: ${requirements.map((r) => r.tagSlug).join(', ')}`
        : 'No eligible members found in org-eligible-member-view.';
    const completedAt = new Date().toISOString();
    await updateSagaStatus(sagaId, {
      status: 'compensated',
      currentStep: 'compensate',
      compensationReason: reason,
      completedAt,
    });
    return { ...initialState, status: 'compensated', currentStep: 'compensate', compensationReason: reason, completedAt, updatedAt: completedAt };
  }

  const approvalResult = await approveOrgScheduleProposal(
    event.scheduleItemId,
    candidate.accountId,
    event.proposedBy,
    {
      workspaceId: event.workspaceId,
      orgId: event.orgId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
    },
    requirements.length > 0 ? requirements : undefined
  );

  if (approvalResult.outcome === 'confirmed') {
    const completedAt = new Date().toISOString();
    await updateSagaStatus(sagaId, {
      status: 'assigned',
      currentStep: 'assign',
      completedAt,
    });
    return { ...initialState, status: 'assigned', currentStep: 'assign', completedAt, updatedAt: completedAt };
  }

  const completedAt = new Date().toISOString();
  await updateSagaStatus(sagaId, {
    status: 'compensated',
    currentStep: 'compensate',
    compensationReason: approvalResult.reason,
    completedAt,
  });
  return {
    ...initialState,
    status: 'compensated',
    currentStep: 'compensate',
    compensationReason: approvalResult.reason,
    completedAt,
    updatedAt: completedAt,
  };
}
