/**
 * workforce-scheduling.slice — Public API
 *
 * Unified VS6 Workforce-Scheduling vertical slice.
 *
 * Merges scheduling.slice (CalendarView governance) and
 * timelineing.slice (TimelineView vis-timeline canvas) into a single,
 * high-cohesion domain slice.
 *
 * Architecture: "One Core, Two Views"
 *   • Core:         _aggregate, _actions, _queries, _hooks (shared by both views)
 *   • CalendarView: _components/CalendarView/ (scheduling grid + governance)
 *   • TimelineView: _components/TimelineView/ (vis-timeline canvas + drag-reschedule)
 *
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
  WriteOp,
} from './_aggregate';

// =================================================================
// Write-Op executor (D3 — caller executes WriteOp from aggregate)
// =================================================================
export { executeWriteOp } from './_write-op';

// =================================================================
// Server Actions — Core schedule mutations (CalendarView)
// =================================================================
export {
  // Workspace-level
  createScheduleItem,
  assignMember,
  unassignMember,
  // Fast-path facade mutations
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
  updateScheduleItemDateRange,
  // HR domain actions
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  completeOrgScheduleAction,
  // Timeline mutations (TimelineView drag-reschedule)
  updateTimelineItemDateRange,
} from './_actions';

// =================================================================
// Queries — Calendar read-path
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
  subscribeToWorkspaceScheduleItems,
  getEligibleMemberForSchedule,
  getEligibleMembersForSchedule,
  DEMAND_BOARD_STALENESS,
  // Timeline read-path (ordered by startDate asc for vis-timeline)
  subscribeToWorkspaceTimelineItems,
} from './_queries';
export type { OrgEligibleMemberView, OrgMemberSkillWithTier } from './_queries';

// =================================================================
// Hooks — CalendarView
// =================================================================
export {
  useOrgSchedule,
  usePendingScheduleProposals,
  useConfirmedScheduleProposals,
  useGlobalSchedule,
  useScheduleActions,
  useWorkspaceSchedule,
  useScheduleEventHandler,
  // TimelineView hooks
  useAccountTimeline,
  useWorkspaceTimeline,
  useTimelineCommands,
} from './_hooks';

// =================================================================
// UI Components — CalendarView
// =================================================================
export { AccountScheduleSection } from './_components/schedule.account-view';
export { OrgScheduleGovernance } from './_components/org-schedule-governance';
export { OrgSkillPoolManager } from './_components/org-skill-pool-manager';
export { WorkspaceSchedule } from './_components/schedule.workspace-view';
export { GovernanceSidebar } from './_components/governance-sidebar';
export { ProposalDialog } from './_components/proposal-dialog';
export { ScheduleProposalContent } from './_components/schedule-proposal-content';
export { ScheduleDataTable } from './_components/schedule-data-table';
export { AccountCapabilityTabs, WorkspaceCapabilityTabs } from './_components/schedule-capability-tabs';
export { UnifiedCalendarGrid } from './_components/unified-calendar-grid';
export { DemandBoard } from './_components/demand-board';

// =================================================================
// UI Components — TimelineView
// =================================================================
export { AccountTimelineSection } from './_components/timeline.account-view';
export { WorkspaceTimeline } from './_components/timeline.workspace-view';

// Backwards-compatible aliases for former timelineing.slice consumers
export {
  AccountCapabilityTabs as AccountTimelineCapabilityTabs,
  WorkspaceCapabilityTabs as WorkspaceTimelineCapabilityTabs,
} from './_components/schedule-capability-tabs';

// =================================================================
// View namespace re-exports (explicit view imports)
// =================================================================
export * as CalendarView from './_components/calendar-view';
export * as TimelineView from './_components/timeline-view';

// =================================================================
// IER Events [D11]
// =================================================================
export {
  WORKFORCE_SCHEDULE_PROPOSED_EVENT,
  WORKFORCE_TIMELINE_DATE_RANGE_UPDATED_EVENT,
  WORKFORCE_SCHEDULE_APPROVED_EVENT,
  WORKFORCE_SCHEDULE_ASSIGNMENT_CANCELLED_EVENT,
} from './_events';
export type { WorkforceSchedulingEvent } from './_events';

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
} from '@/features/projection.bus';

// AccountScheduleProjection types — read model types for scheduling queries.
export type { AccountScheduleProjection, AccountScheduleAssignment } from './_projectors/account-schedule';

// =================================================================
// Eligibility (QGWAY_SCHED pure business logic — D4 eligible-member channel)
// =================================================================
export {
  SAGA_TIER_ORDER,
  sagaTierIndex,
  findEligibleCandidate,
  findEligibleCandidatesForRequirements,
} from './_eligibility';
export type { SagaTier, CandidateAssignment } from './_eligibility';

// =================================================================
// Pure Selectors (data-derivation — no React dependencies)
// =================================================================
export {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from './_selectors';
export type { ScheduleItemWithWorkspace, ScheduleItemWithMembers } from './_selectors';

// =================================================================
// Saga (cross-org coordination — used by event relay worker)
// =================================================================
export { startSchedulingSaga, getSagaState } from './_saga';
export type { SagaState, SagaStep, SagaStatus } from './_saga';

// =================================================================
// Domain rules
// =================================================================
export { canTransitionScheduleStatus, VALID_STATUS_TRANSITIONS } from './_schedule.rules';

// =================================================================
// Local view-model types [D19]
// =================================================================
export type { TimelineMember } from './_types';
