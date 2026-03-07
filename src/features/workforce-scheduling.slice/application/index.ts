/**
 * Module: application/index.ts
 * Purpose: Application-layer public exports for VS6 workforce scheduling.
 * Responsibilities: Expose actions, queries, selectors, and saga orchestration.
 * Constraints: deterministic logic, respect module boundaries
 */

export { executeWriteOp } from '../_write-op';

export {
  createScheduleItem,
  assignMember,
  unassignMember,
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
  updateScheduleItemDateRange,
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  completeOrgScheduleAction,
} from '../_actions';

export {
  getScheduleItems,
  getOrgScheduleItem,
  getOrgScheduleProposal,
  subscribeToOrgScheduleProposals,
  subscribeToPendingProposals,
  subscribeToConfirmedProposals,
  getActiveDemands,
  subscribeToDemandBoard,
  getAllDemands,
  getAccountScheduleProjection,
  getAccountActiveAssignments,
  subscribeToWorkspaceScheduleItems,
  getEligibleMemberForSchedule,
  getEligibleMembersForSchedule,
  DEMAND_BOARD_STALENESS,
} from '../_queries';
export type { OrgEligibleMemberView, OrgMemberSkillWithTier } from '../_queries';

export {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from '../_selectors';
export type { ScheduleItemWithWorkspace, ScheduleItemWithMembers } from '../_selectors';

export { startSchedulingSaga, getSagaState } from '../_saga';
export type { SagaState, SagaStep, SagaStatus } from '../_saga';

// Legacy compatibility: projector handlers are implemented in VS0 projection bus.
export {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from '../_projectors/demand-board';

export type { AccountScheduleProjection, AccountScheduleAssignment } from '../_projectors/account-schedule';
