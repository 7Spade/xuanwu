/**
 * Module: application/index.ts
 * Purpose: Application-layer public exports for VS6 workforce scheduling.
 * Responsibilities: Expose actions, queries, selectors, and saga orchestration.
 * Constraints: deterministic logic, respect module boundaries
 */

export { executeWriteOp } from './commands/write-op';

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
} from './commands';

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
} from './queries';
export type { OrgEligibleMemberView, OrgMemberSkillWithTier } from './queries';

export {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from './selectors';
export type { ScheduleItemWithWorkspace, ScheduleItemWithMembers } from './selectors';

export { startSchedulingSaga, getSagaState } from './sagas';
export type { SagaState, SagaStep, SagaStatus } from './sagas';

// Legacy compatibility: projector handlers are implemented in VS0 projection bus.
export type {
  AccountScheduleProjection,
  AccountScheduleAssignment,
} from './projectors/runtime/account-schedule';
