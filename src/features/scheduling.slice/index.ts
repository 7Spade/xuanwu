/**
 * scheduling.slice — Public API
 *
 * Unified VS6 Scheduling vertical slice.
 * Domain: accounts/{orgId}/schedule_items (single source of truth)
 * Staleness: DEMAND_BOARD ≤ 5s | STANDARD ≤ 10s (SK_STALENESS_CONTRACT)
 *
 * External consumers import exclusively from this file.
 */

// =================================================================
// Domain Aggregate
// =================================================================
export {
  handleScheduleProposed,
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
  cancelOrgScheduleAssignment,
  orgScheduleProposalSchema,
  ORG_SCHEDULE_STATUSES,
} from './_aggregate';
export type {
  OrgScheduleProposal,
  OrgScheduleStatus,
  ScheduleApprovalResult,
} from './_aggregate';

// =================================================================
// Server Actions (all schedule mutations go through here)
// =================================================================
export {
  // Workspace-level
  createScheduleItem,
  assignMember,
  unassignMember,
  // Fast-path facade mutations
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
  // HR domain actions
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  completeOrgScheduleAction,
} from './_actions';

// =================================================================
// Queries (read-only)
// =================================================================
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
  DEMAND_BOARD_STALENESS,
} from './_queries';

// =================================================================
// Hooks (React)
// =================================================================
export { useOrgSchedule, usePendingScheduleProposals, useConfirmedScheduleProposals } from './_hooks/use-org-schedule';
export { useGlobalSchedule } from './_hooks/use-global-schedule';
export { useScheduleActions } from './_hooks/use-schedule-commands';
export { useWorkspaceSchedule } from './_hooks/use-workspace-schedule';
export { useScheduleEventHandler } from './_hooks/use-schedule-event-handler';

// =================================================================
// UI Components
// =================================================================
// Account-level views
export { AccountScheduleSection } from './_components/schedule.account-view';
export { OrgScheduleGovernance } from './_components/org-schedule-governance';
// Workspace-level views
export { WorkspaceSchedule } from './_components/schedule.workspace-view';
// Shared schedule UI primitives
export { GovernanceSidebar } from './_components/governance-sidebar';
export { ProposalDialog } from './_components/proposal-dialog';
export { ScheduleProposalContent } from './_components/schedule-proposal-content';
export { ScheduleDataTable } from './_components/schedule-data-table';
export { UnifiedCalendarGrid } from './_components/unified-calendar-grid';
export { DemandBoard } from './_components/demand-board';

// =================================================================
// Projectors (event handlers — used by projection.event-funnel)
// =================================================================
export {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from './_projectors/demand-board';

export {
  initAccountScheduleProjection,
  applyScheduleAssigned,
  applyScheduleCompleted,
} from './_projectors/account-schedule';
export type { AccountScheduleProjection, AccountScheduleAssignment } from './_projectors/account-schedule';

// =================================================================
// Saga (cross-org coordination — used by event relay worker)
// =================================================================
export { startSchedulingSaga, getSagaState } from './_saga';
export type { SagaState, SagaStep, SagaStatus } from './_saga';
