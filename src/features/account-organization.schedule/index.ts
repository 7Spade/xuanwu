/**
 * account-organization.schedule — DEPRECATED shim
 *
 * All VS6 scheduling code has been consolidated into scheduling.slice.
 * This file re-exports for backward compatibility.
 * @deprecated Import from '@/features/scheduling.slice' directly.
 */
export {
  handleScheduleProposed,
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
  cancelOrgScheduleAssignment,
  orgScheduleProposalSchema,
  ORG_SCHEDULE_STATUSES,
  getOrgScheduleItem,
  getOrgScheduleProposal,
  subscribeToOrgScheduleProposals,
  subscribeToPendingProposals,
  subscribeToConfirmedProposals,
  useOrgSchedule,
  usePendingScheduleProposals,
  useConfirmedScheduleProposals,
  OrgScheduleGovernance,
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  completeOrgScheduleAction,
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '@/features/scheduling.slice';
export type {
  OrgScheduleProposal,
  OrgScheduleStatus,
  ScheduleApprovalResult,
} from '@/features/scheduling.slice';
