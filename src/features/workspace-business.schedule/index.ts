/**
 * workspace-business.schedule — DEPRECATED shim
 *
 * All VS6 scheduling code has been consolidated into scheduling.slice.
 * This file re-exports for backward compatibility.
 * @deprecated Import from '@/features/scheduling.slice' directly.
 */
export {
  AccountScheduleSection,
  WorkspaceSchedule,
  GovernanceSidebar,
  ProposalDialog,
  ScheduleProposalContent,
  ScheduleDataTable,
  UnifiedCalendarGrid,
  DemandBoard,
  useGlobalSchedule,
  useScheduleActions,
  useWorkspaceSchedule,
  useScheduleEventHandler,
  createScheduleItem,
  assignMember,
  unassignMember,
  updateScheduleItemStatus,
  approveScheduleItemWithMember,
  getScheduleItems,
} from '@/features/scheduling.slice';
