/**
 * organization.slice — Public API
 *
 * Consolidated VS4 Organization vertical slice.
 * Covers: Organization Core, Organization Event Bus,
 *         Gov Teams, Gov Members, Gov Partners, Gov Policy.
 *
 * External consumers import exclusively from this file.
 */

// =================================================================
// Core (organization-core.aggregate + lifecycle)
// =================================================================
export { AccountNewForm, AccountGrid, useOrganizationManagement } from './core';
export {
  createOrganization,
  updateOrganizationSettings,
  deleteOrganization,
  setupOrganizationWithTeam,
} from './core';
export { getOrganization, subscribeToOrganization } from './core';

// =================================================================
// Core Event Bus (organization-core.event-bus)
// =================================================================
export { onOrgEvent, publishOrgEvent } from './core.event-bus';
export type {
  ScheduleAssignedPayload,
  ScheduleCompletedPayload,
  ScheduleAssignmentCancelledPayload,
  ScheduleAssignRejectedPayload,
  ScheduleProposalCancelledPayload,
  OrgPolicyChangedPayload,
  OrgMemberJoinedPayload,
  OrgMemberLeftPayload,
  OrgTeamUpdatedPayload,
  SkillXpAddedPayload,
  SkillXpDeductedPayload,
  SkillRecognitionGrantedPayload,
  SkillRecognitionRevokedPayload,
  OrganizationEventPayloadMap,
  OrganizationEventKey,
} from './core.event-bus';

// =================================================================
// Gov Teams (account-organization.team)
// =================================================================
export { useTeamManagement, TeamsView, TeamDetailView } from './gov.teams';
export { createTeam, updateTeamMembers } from './gov.teams';
export { getOrgTeams, subscribeToOrgTeams } from './gov.teams';

// =================================================================
// Gov Members (account-organization.member)
// =================================================================
export { useMemberManagement, MembersView } from './gov.members';
export { recruitMember, dismissMember } from './gov.members';
export { getOrgMembers, subscribeToOrgMembers } from './gov.members';

// =================================================================
// Gov Partners (account-organization.partner)
// =================================================================
export { usePartnerManagement, PartnersView, PartnerDetailView } from './gov.partners';
export { createPartnerGroup, sendPartnerInvite, dismissPartnerMember } from './gov.partners';
export { getOrgPartners, subscribeToOrgPartners, subscribeToOrgPartnerInvites } from './gov.partners';

// =================================================================
// Gov Policy (account-organization.policy)
// =================================================================
export { createOrgPolicy, updateOrgPolicy, deleteOrgPolicy } from './gov.policy';
export type {
  OrgPolicy,
  OrgPolicyRule,
  CreateOrgPolicyInput,
  UpdateOrgPolicyInput,
} from './gov.policy';
export { getOrgPolicy, subscribeToOrgPolicies, getOrgPoliciesByScope } from './gov.policy';
export { useOrgPolicy } from './gov.policy';
