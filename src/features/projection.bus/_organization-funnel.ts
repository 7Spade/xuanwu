/**
 * Module: _organization-funnel
 * Purpose: Organization event funnel registration
 * Responsibilities: subscribe org events and project schedule/member/skill read models
 * Constraints: deterministic logic, respect module boundaries
 */

import { onOrgEvent } from '@/features/organization.slice';
import { applySkillXpAdded, applySkillXpDeducted } from '@/features/skill-xp.slice';

import { createVersionStamp } from './_funnel.shared';
import { upsertProjectionVersion } from './_registry';
import { applyScheduleAssigned, applyScheduleCompleted } from './account-schedule';
import {
  applyDemandAssigned,
  applyDemandAssignmentCancelled,
  applyDemandAssignRejected,
  applyDemandCompleted,
  applyDemandProposalCancelled,
} from './demand-board';
import {
  applyOrgMemberSkillXp,
  initOrgMemberEntry,
  removeOrgMemberEntry,
  updateOrgMemberEligibility,
} from './org-eligible-member-view';
import { applyMemberJoined, applyMemberLeft } from './organization-view';

export function registerOrganizationFunnel(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onOrgEvent('organization:schedule:assigned', async (payload) => {
      await applyScheduleAssigned(
        payload.targetAccountId,
        {
          scheduleItemId: payload.scheduleItemId,
          workspaceId: payload.workspaceId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          status: 'upcoming',
        },
        payload.aggregateVersion,
        payload.traceId
      );
      await updateOrgMemberEligibility(
        payload.orgId,
        payload.targetAccountId,
        false,
        payload.aggregateVersion,
        payload.traceId
      );
      await applyDemandAssigned(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-schedule', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:schedule:completed', async (payload) => {
      await applyScheduleCompleted(
        payload.targetAccountId,
        payload.scheduleItemId,
        payload.aggregateVersion,
        payload.traceId
      );
      await updateOrgMemberEligibility(
        payload.orgId,
        payload.targetAccountId,
        true,
        payload.aggregateVersion,
        payload.traceId
      );
      await applyDemandCompleted(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-schedule', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:schedule:assignmentCancelled', async (payload) => {
      await updateOrgMemberEligibility(
        payload.orgId,
        payload.targetAccountId,
        true,
        payload.aggregateVersion,
        payload.traceId
      );
      await applyDemandAssignmentCancelled(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-schedule', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:schedule:proposalCancelled', async (payload) => {
      await applyDemandProposalCancelled(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('demand-board', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:schedule:assignRejected', async (payload) => {
      await applyDemandAssignRejected(payload);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('demand-board', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:member:joined', async (payload) => {
      await applyMemberJoined(payload.orgId, payload.accountId, undefined, payload.traceId);
      await initOrgMemberEntry(payload.orgId, payload.accountId);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('organization-view', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:member:left', async (payload) => {
      await applyMemberLeft(payload.orgId, payload.accountId);
      await removeOrgMemberEntry(payload.orgId, payload.accountId);

      const stamp = createVersionStamp();
      await upsertProjectionVersion('organization-view', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:skill:xpAdded', async (payload) => {
      await applySkillXpAdded(
        payload.accountId,
        payload.skillId,
        payload.newXp,
        payload.aggregateVersion,
        payload.traceId
      );
      await applyOrgMemberSkillXp({
        orgId: payload.orgId,
        accountId: payload.accountId,
        skillId: payload.skillId,
        newXp: payload.newXp,
        traceId: payload.traceId,
        aggregateVersion: payload.aggregateVersion,
      });

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-skill-view', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:skill:xpDeducted', async (payload) => {
      await applySkillXpDeducted(
        payload.accountId,
        payload.skillId,
        payload.newXp,
        payload.aggregateVersion,
        payload.traceId
      );
      await applyOrgMemberSkillXp({
        orgId: payload.orgId,
        accountId: payload.accountId,
        skillId: payload.skillId,
        newXp: payload.newXp,
        traceId: payload.traceId,
        aggregateVersion: payload.aggregateVersion,
      });

      const stamp = createVersionStamp();
      await upsertProjectionVersion('account-skill-view', stamp.version, stamp.updatedAt);
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:skill:recognitionGranted', async (payload) => {
      const stamp = createVersionStamp();
      await upsertProjectionVersion(
        `org-skill-recognition-${payload.organizationId}`,
        stamp.version,
        stamp.updatedAt
      );
    })
  );

  unsubscribers.push(
    onOrgEvent('organization:skill:recognitionRevoked', async (payload) => {
      const stamp = createVersionStamp();
      await upsertProjectionVersion(
        `org-skill-recognition-${payload.organizationId}`,
        stamp.version,
        stamp.updatedAt
      );
    })
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
