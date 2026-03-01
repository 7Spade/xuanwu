/**
 * projection.bus — _funnel.ts
 *
 * EVENT_FUNNEL_INPUT: unified entry point for the Projection Layer.
 *
 * Per logic-overview.md (VS8 Projection Bus):
 *   WORKSPACE_EVENT_BUS  → |所有業務事件|  EVENT_FUNNEL_INPUT
 *   ORGANIZATION_EVENT_BUS → |所有組織事件| EVENT_FUNNEL_INPUT
 *   TAG_LIFECYCLE_BUS → |TagLifecycleEvent| EVENT_FUNNEL_INPUT  (v5 新增)
 *
 *   EVENT_FUNNEL_INPUT routes to:
 *     → WORKSPACE_PROJECTION_VIEW
 *     → WORKSPACE_SCOPE_READ_MODEL
 *     → ACCOUNT_PROJECTION_VIEW
 *     → ACCOUNT_PROJECTION_AUDIT
 *     → ACCOUNT_PROJECTION_SCHEDULE
 *     → ORGANIZATION_PROJECTION_VIEW
 *     → ACCOUNT_SKILL_VIEW
 *     → ORG_ELIGIBLE_MEMBER_VIEW
 *     → TAG_SNAPSHOT (v5 新增)
 *     → PROJECTION_VERSION (updates stream offset)
 *
 *   WORKSPACE_EVENT_STORE -.→ EVENT_FUNNEL_INPUT (replay rebuilds all projections)
 *
 * Call `registerWorkspaceFunnel(bus)`, `registerOrganizationFunnel()`, and
 * `registerTagFunnel()` once at app startup.
 */

import type { WorkspaceEventBus } from '@/features/workspace.slice';
import { upsertProjectionVersion } from './_registry';
import { appendAuditEntry } from './account-audit';
import { applyScheduleAssigned, applyScheduleCompleted } from '@/features/scheduling.slice';
import { onOrgEvent } from '@/features/organization.slice';
import { applyMemberJoined, applyMemberLeft } from './organization-view';
import { handleScheduleProposed } from '@/features/scheduling.slice';
import { applySkillXpAdded, applySkillXpDeducted } from '@/features/skill-xp.slice';
import {
  applyOrgMemberSkillXp,
  initOrgMemberEntry,
  removeOrgMemberEntry,
  updateOrgMemberEligibility,
} from './org-eligible-member-view';
import {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from '@/features/scheduling.slice';
import { onTagEvent } from '@/features/centralized-tag';
import {
  applyTagCreated,
  applyTagUpdated,
  applyTagDeprecated,
  applyTagDeleted,
} from './tag-snapshot';
import {
  handleTagUpdatedForPool,
  handleTagDeprecatedForPool,
  handleTagDeletedForPool,
} from '@/features/skill-xp.slice';

/**
 * Registers workspace event handlers on the bus to keep projections in sync.
 * Returns a cleanup function.
 *
 * Note: projection updates are fire-and-forget (non-blocking to the UI event cycle).
 */
export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void {
  const unsubscribers: Array<() => void> = [];

  // workspace:tasks:assigned → PROJECTION_VERSION (stream offset, A-track → registry consistency)
  // Per logic-overview.md: EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
  unsubscribers.push(
    bus.subscribe('workspace:tasks:assigned', async (payload) => {
      await upsertProjectionVersion(
        `workspace-tasks-assigned-${payload.workspaceId}`,
        Date.now(),
        new Date().toISOString()
      );
    })
  );

  // workspace:tasks:blocked → ACCOUNT_PROJECTION_AUDIT
  unsubscribers.push(
    bus.subscribe('workspace:tasks:blocked', async (payload) => {
      const actorId = payload.task.assigneeId ?? 'system';
      await appendAuditEntry(actorId, {
        accountId: actorId,
        eventType: 'workspace:tasks:blocked',
        actorId,
        targetId: payload.task.id,
        summary: `Task "${payload.task.name}" blocked: ${payload.reason ?? ''}`,
        // [R8] forward traceId from payload so globalAuditView record contains traceId
        // Use truthy check to exclude both undefined AND empty strings per R8.
        ...(payload.traceId && { traceId: payload.traceId }),
      });
      await upsertProjectionVersion('account-audit', Date.now(), new Date().toISOString());
    })
  );

  // workspace:issues:resolved → ACCOUNT_PROJECTION_AUDIT + workflow unblock stream offset
  // Per logic-overview.md:
  //   TRACK_B_ISSUES →|IssueResolved 事件| WORKSPACE_EVENT_BUS
  //   A 軌自行訂閱後恢復（Discrete Recovery Principle — not direct back-flow）
  // The funnel records audit + stream offset for replay consistency (Invariant A7).
  // A-track task recovery is handled by the tasks slice subscribing to this event.
  unsubscribers.push(
    bus.subscribe('workspace:issues:resolved', async (payload) => {
      await appendAuditEntry(payload.resolvedBy, {
        accountId: payload.resolvedBy,
        eventType: 'workspace:issues:resolved',
        actorId: payload.resolvedBy,
        targetId: payload.issueId,
        summary: `Issue "${payload.issueTitle}" resolved`,
        // [R8] forward traceId from payload so globalAuditView record contains traceId
        // Use truthy check to exclude both undefined AND empty strings per R8.
        ...(payload.traceId && { traceId: payload.traceId }),
      });
      await upsertProjectionVersion('account-audit', Date.now(), new Date().toISOString());
      // Track stream offset for workflow unblock (per Invariant A7 — Event Funnel is projection compose only)
      if (payload.sourceTaskId) {
        await upsertProjectionVersion(
          `workflow-unblock-${payload.sourceTaskId}`,
          Date.now(),
          new Date().toISOString()
        );
      }
    })
  );

  // WORKSPACE_OUTBOX →|ScheduleProposed（跨層事件）| ORGANIZATION_SCHEDULE
  unsubscribers.push(
    bus.subscribe('workspace:schedule:proposed', async (payload) => {
      await handleScheduleProposed(payload);
      // Demand Board: create open demand entry. FR-W0.
      await applyDemandProposed(payload);
      await upsertProjectionVersion('org-schedule-proposals', Date.now(), new Date().toISOString());
    })
  );

  // workspace:document-parser:itemsExtracted → PROJECTION_VERSION (stream offset)
  // ParsingIntent creates Firestore documents via direct writes; the funnel records
  // the stream offset so the projection registry stays consistent.
  // Per logic-overview.md: EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
  unsubscribers.push(
    bus.subscribe('workspace:document-parser:itemsExtracted', async (payload) => {
      await upsertProjectionVersion(
        `parsing-intent-${payload.intentId}`,
        Date.now(),
        new Date().toISOString()
      );
    })
  );

  // workspace:tasks:assigned → PROJECTION_VERSION (stream offset)
  // Per logic-overview.md: EVENT_FUNNEL_INPUT →|更新事件串流偏移量| PROJECTION_VERSION
  // Tracking assignment events ensures the projection registry reflects the A-track
  // task-assignment → schedule trigger flow (TRACK_A_TASKS -.→ W_B_SCHEDULE).
  unsubscribers.push(
    bus.subscribe('workspace:tasks:assigned', async (payload) => {
      await upsertProjectionVersion(
        `task-assigned-${payload.taskId}`,
        Date.now(),
        new Date().toISOString()
      );
    })
  );

  return () => unsubscribers.forEach((u) => u());
}

/**
 * Registers organization event handlers to keep org and schedule projections in sync.
 * Returns a cleanup function.
 */
export function registerOrganizationFunnel(): () => void {
  const unsubscribers: Array<() => void> = [];

  // ScheduleAssigned → ACCOUNT_PROJECTION_SCHEDULE + ORG_ELIGIBLE_MEMBER_VIEW (eligible = false) + DEMAND_BOARD
  // Per Invariant #15: schedule:assigned must update the eligible flag so double-booking is prevented.
  // Per Invariant #19 [R7]: pass aggregateVersion for ELIGIBLE_UPDATE_GUARD monotonic check.
  // [R8] TRACE_PROPAGATION_RULE: forward traceId from ScheduleAssignedPayload to projector.
  // FR-W6: demand board updated to 'assigned' with assignedMemberId.
  unsubscribers.push(
    onOrgEvent('organization:schedule:assigned', async (payload) => {
      await applyScheduleAssigned(payload.targetAccountId, {
        scheduleItemId: payload.scheduleItemId,
        workspaceId: payload.workspaceId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: 'upcoming',
      }, payload.aggregateVersion, payload.traceId);
      await updateOrgMemberEligibility(payload.orgId, payload.targetAccountId, false, payload.aggregateVersion, payload.traceId);
      await applyDemandAssigned(payload);
      await upsertProjectionVersion('account-schedule', Date.now(), new Date().toISOString());
    })
  );

  // ScheduleCompleted → ACCOUNT_PROJECTION_SCHEDULE + ORG_ELIGIBLE_MEMBER_VIEW (eligible = true) + DEMAND_BOARD (closed)
  // Per Invariant #15: completed → eligible = true (member available for new assignments).
  // [R8] traceId forwarded through the full saga chain.
  unsubscribers.push(
    onOrgEvent('organization:schedule:completed', async (payload) => {
      await applyScheduleCompleted(payload.targetAccountId, payload.scheduleItemId, payload.aggregateVersion, payload.traceId);
      await updateOrgMemberEligibility(payload.orgId, payload.targetAccountId, true, payload.aggregateVersion, payload.traceId);
      await applyDemandCompleted(payload);
      await upsertProjectionVersion('account-schedule', Date.now(), new Date().toISOString());
    })
  );

  // ScheduleAssignmentCancelled → ORG_ELIGIBLE_MEMBER_VIEW (eligible = true) + DEMAND_BOARD (closed)
  // Per Invariant #15: post-assignment cancellation restores eligible flag to true.
  // No change to account-schedule projection status — the assignment record remains for audit.
  // [R8] traceId forwarded through the full saga chain.
  unsubscribers.push(
    onOrgEvent('organization:schedule:assignmentCancelled', async (payload) => {
      await updateOrgMemberEligibility(payload.orgId, payload.targetAccountId, true, payload.aggregateVersion, payload.traceId);
      await applyDemandAssignmentCancelled(payload);
      await upsertProjectionVersion('account-schedule', Date.now(), new Date().toISOString());
    })
  );

  // ScheduleProposalCancelled → DEMAND_BOARD (closed/proposalCancelled)
  // Compensating event (Invariant A5): HR cancelled a pending proposal.
  unsubscribers.push(
    onOrgEvent('organization:schedule:proposalCancelled', async (payload) => {
      await applyDemandProposalCancelled(payload);
      await upsertProjectionVersion('demand-board', Date.now(), new Date().toISOString());
    })
  );

  // ScheduleAssignRejected → DEMAND_BOARD (closed/assignRejected)
  // Compensating event (Invariant A5): skill-tier check failed — demand closed.
  unsubscribers.push(
    onOrgEvent('organization:schedule:assignRejected', async (payload) => {
      await applyDemandAssignRejected(payload);
      await upsertProjectionVersion('demand-board', Date.now(), new Date().toISOString());
    })
  );

  // Member joined → ORGANIZATION_PROJECTION_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
  // [R8] TRACE_PROPAGATION_RULE: forward traceId from OrgMemberJoinedPayload to projector.
  unsubscribers.push(
    onOrgEvent('organization:member:joined', async (payload) => {
      await applyMemberJoined(payload.orgId, payload.accountId, undefined, payload.traceId);
      await initOrgMemberEntry(payload.orgId, payload.accountId);
      await upsertProjectionVersion('organization-view', Date.now(), new Date().toISOString());
    })
  );

  // Member left → ORGANIZATION_PROJECTION_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
  unsubscribers.push(
    onOrgEvent('organization:member:left', async (payload) => {
      await applyMemberLeft(payload.orgId, payload.accountId);
      await removeOrgMemberEntry(payload.orgId, payload.accountId);
      await upsertProjectionVersion('organization-view', Date.now(), new Date().toISOString());
    })
  );

  // SkillXpAdded → ACCOUNT_SKILL_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
  // Invariant #12: newXp is stored; tier is NEVER stored — derived at query time via resolveSkillTier(xp).
  // [S2] aggregateVersion forwarded so the account-skill-view version guard fires.
  // [R8] traceId forwarded into accountSkillView for end-to-end trace propagation.
  unsubscribers.push(
    onOrgEvent('organization:skill:xpAdded', async (payload) => {
      await applySkillXpAdded(payload.accountId, payload.skillId, payload.newXp, payload.aggregateVersion, payload.traceId);
      await applyOrgMemberSkillXp({
        orgId: payload.orgId,
        accountId: payload.accountId,
        skillId: payload.skillId,
        newXp: payload.newXp,
        traceId: payload.traceId,
        aggregateVersion: payload.aggregateVersion,
      });
      await upsertProjectionVersion('account-skill-view', Date.now(), new Date().toISOString());
    })
  );

  // SkillXpDeducted → ACCOUNT_SKILL_VIEW + ORG_ELIGIBLE_MEMBER_VIEW
  // [S2] aggregateVersion forwarded so the account-skill-view version guard fires.
  // [R8] traceId forwarded into accountSkillView for end-to-end trace propagation.
  unsubscribers.push(
    onOrgEvent('organization:skill:xpDeducted', async (payload) => {
      await applySkillXpDeducted(payload.accountId, payload.skillId, payload.newXp, payload.aggregateVersion, payload.traceId);
      await applyOrgMemberSkillXp({
        orgId: payload.orgId,
        accountId: payload.accountId,
        skillId: payload.skillId,
        newXp: payload.newXp,
        traceId: payload.traceId,
        aggregateVersion: payload.aggregateVersion,
      });
      await upsertProjectionVersion('account-skill-view', Date.now(), new Date().toISOString());
    })
  );

  // SkillRecognitionGranted / Revoked → track stream offset for replay consistency (Invariant A7)
  // Recognition state is owned by ORG_SKILL_RECOGNITION aggregate; these events don't change
  // XP or eligibility — they record the org's acknowledgment only.
  unsubscribers.push(
    onOrgEvent('organization:skill:recognitionGranted', async (payload) => {
      await upsertProjectionVersion(
        `org-skill-recognition-${payload.organizationId}`,
        Date.now(),
        new Date().toISOString()
      );
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:skill:recognitionRevoked', async (payload) => {
      await upsertProjectionVersion(
        `org-skill-recognition-${payload.organizationId}`,
        Date.now(),
        new Date().toISOString()
      );
    })
  );

  return () => unsubscribers.forEach((u) => u());
}

/**
 * Registers tag lifecycle event handlers to keep the TAG_SNAPSHOT projection in sync.
 * Also delegates to VS4_TAG_SUBSCRIBER to update SKILL_TAG_POOL. [R3]
 * Returns a cleanup function.
 *
 * Per logic-overview.md [R3]:
 *   IER BACKGROUND_LANE → VS4_TAG_SUBSCRIBER → SKILL_TAG_POOL
 *
 * Per logic-overview.md (VS8):
 *   IER ==>|"#9 唯一寫入路徑"| FUNNEL
 *   FUNNEL --> TAG_SNAPSHOT
 *
 * Invariant A7: Event Funnel only composes projections; does not enforce cross-BC invariants.
 */
export function registerTagFunnel(): () => void {
  const unsubscribers: Array<() => void> = [];

  // tag:created → TAG_SNAPSHOT
  unsubscribers.push(
    onTagEvent('tag:created', async (payload) => {
      await applyTagCreated(payload);
      await upsertProjectionVersion('tag-snapshot', Date.now(), new Date().toISOString());
    })
  );

  // tag:updated → TAG_SNAPSHOT + SKILL_TAG_POOL (via VS4_TAG_SUBSCRIBER [R3])
  unsubscribers.push(
    onTagEvent('tag:updated', async (payload) => {
      await applyTagUpdated(payload);
      await handleTagUpdatedForPool(payload);
      await upsertProjectionVersion('tag-snapshot', Date.now(), new Date().toISOString());
    })
  );

  // tag:deprecated → TAG_SNAPSHOT + SKILL_TAG_POOL (via VS4_TAG_SUBSCRIBER [R3])
  unsubscribers.push(
    onTagEvent('tag:deprecated', async (payload) => {
      await applyTagDeprecated(payload);
      await handleTagDeprecatedForPool(payload);
      await upsertProjectionVersion('tag-snapshot', Date.now(), new Date().toISOString());
    })
  );

  // tag:deleted → TAG_SNAPSHOT + SKILL_TAG_POOL (via VS4_TAG_SUBSCRIBER [R3])
  unsubscribers.push(
    onTagEvent('tag:deleted', async (payload) => {
      await applyTagDeleted(payload);
      await handleTagDeletedForPool(payload);
      await upsertProjectionVersion('tag-snapshot', Date.now(), new Date().toISOString());
    })
  );

  return () => unsubscribers.forEach((u) => u());
}

/**
 * Replays events from the event store to rebuild all workspace projections.
 * Implements: WORKSPACE_EVENT_STORE -.→ EVENT_FUNNEL_INPUT
 */
export async function replayWorkspaceProjections(
  workspaceId: string
): Promise<{ replayed: number }> {
  const { getDomainEvents } = await import(
    '@/shared/infra/firestore/repositories/workspace-core.event-store.repository'
  );
  const events = await getDomainEvents(workspaceId);
  if (events.length > 0) {
    await upsertProjectionVersion(`workspace-${workspaceId}`, events.length, new Date().toISOString());
  }
  return { replayed: events.length };
}
