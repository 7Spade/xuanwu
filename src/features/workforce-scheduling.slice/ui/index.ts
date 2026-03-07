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
} from '../_hooks';

export {
  useAccountTimeline,
  useWorkspaceTimeline,
  useTimelineCommands,
} from '../_hooks';
export type { TimelineMember } from '../_timeline.types';

export { AccountScheduleSection } from '../_components/schedule.account-view';
export { OrgScheduleGovernance } from '../_components/org-schedule-governance';
export { OrgSkillPoolManager } from '../_components/org-skill-pool-manager';

export { WorkspaceSchedule } from '../_components/schedule.workspace-view';

export { GovernanceSidebar } from '../_components/governance-sidebar';
export { ProposalDialog } from '../_components/proposal-dialog';
export { ScheduleProposalContent } from '../_components/schedule-proposal-content';
export { ScheduleDataTable } from '../_components/schedule-data-table';
export { AccountCapabilityTabs, WorkspaceCapabilityTabs } from '../_components/schedule-capability-tabs';
export { UnifiedCalendarGrid } from '../_components/unified-calendar-grid';
export { DemandBoard } from '../_components/demand-board';

export { TimelineCanvas } from '../_components/timeline-canvas';
export { AccountTimelineSection } from '../_components/timeline.account-view';
export { WorkspaceTimeline } from '../_components/timeline.workspace-view';
export {
  AccountTimelineCapabilityTabs,
  WorkspaceTimelineCapabilityTabs,
} from '../_components/timeline-capability-tabs';
