// account-organization.schedule — HR scheduling management · ScheduleAssigned event (FCM Layer 1)
// Aggregate state machine: draft → proposed → confirmed | cancelled
// Skill validation reads projection.org-eligible-member-view (Invariant #14).
// Tier derived via resolveSkillTier(xp), never stored in DB (Invariant #12).
// ScheduleAssignRejected and ScheduleProposalCancelled are compensating events (Scheduling Saga, Invariant A5).

export { handleScheduleProposed, approveOrgScheduleProposal, cancelOrgScheduleProposal, completeOrgSchedule, cancelOrgScheduleAssignment, orgScheduleProposalSchema, ORG_SCHEDULE_STATUSES } from './_schedule';
export type {
  OrgScheduleProposal,
  OrgScheduleStatus,
  ScheduleApprovalResult,
} from './_schedule';

export {
  getOrgScheduleItem,
  getOrgScheduleProposal,
  subscribeToOrgScheduleProposals,
  subscribeToPendingProposals,
  subscribeToConfirmedProposals,
} from './_queries';

export { useOrgSchedule, usePendingScheduleProposals, useConfirmedScheduleProposals } from './_hooks/use-org-schedule';

export { OrgScheduleGovernance } from './_components/org-schedule-governance';

// FR-W6 — Server Actions for manual schedule assignment (Critical Gap #0)
// FR-S6 — Server Action to complete a confirmed schedule
export { manualAssignScheduleMember, cancelScheduleProposalAction, completeOrgScheduleAction } from './_actions';

