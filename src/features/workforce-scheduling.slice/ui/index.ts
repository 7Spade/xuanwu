/**
 * Module: ui/index.ts
 * Purpose: UI-layer public exports for VS6 workforce scheduling.
 * Responsibilities: Expose components and React hooks for schedule/timeline screens.
 * Constraints: deterministic logic, respect module boundaries
 */

export {
  useOrgSchedule,
  usePendingScheduleProposals,
  useConfirmedScheduleProposals,
  useGlobalSchedule,
  useScheduleActions,
  useWorkspaceSchedule,
  useScheduleEventHandler,
  useAccountTimeline,
  useWorkspaceTimeline,
  useTimelineCommands,
} from './hooks/runtime';

export type { TimelineMember } from './types/timeline.types';

export { AccountScheduleSection } from './components/runtime/schedule.account-view';
export { OrgScheduleGovernance } from './components/runtime/org-schedule-governance';
export { OrgSkillPoolManager } from './components/runtime/org-skill-pool-manager';
export { WorkspaceSchedule } from './components/runtime/schedule.workspace-view';
export { GovernanceSidebar } from './components/runtime/governance-sidebar';
export { ProposalDialog } from './components/runtime/proposal-dialog';
export { ScheduleProposalContent } from './components/runtime/schedule-proposal-content';
export { ScheduleDataTable } from './components/runtime/schedule-data-table';
export { AccountCapabilityTabs, WorkspaceCapabilityTabs } from './components/runtime/schedule-capability-tabs';
export { UnifiedCalendarGrid } from './components/runtime/unified-calendar-grid';
export { DemandBoard } from './components/runtime/demand-board';
export { TimelineCanvas } from './components/runtime/timeline-canvas';
export { AccountTimelineSection } from './components/runtime/timeline.account-view';
export { WorkspaceTimeline } from './components/runtime/timeline.workspace-view';
export {
  AccountTimelineCapabilityTabs,
  WorkspaceTimelineCapabilityTabs,
} from './components/runtime/timeline-capability-tabs';
