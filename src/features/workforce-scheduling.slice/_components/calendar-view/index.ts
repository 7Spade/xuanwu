/**
 * Module: _components/calendar-view/index.ts
 * Purpose: Re-export barrel for the CalendarView (schedule calendar grid).
 * Responsibilities: expose scheduling calendar components under the CalendarView namespace.
 * Constraints: deterministic logic, respect module boundaries
 *
 * Corresponds to the original scheduling.slice calendar/schedule components.
 */

export { AccountScheduleSection } from '../schedule.account-view';
export { WorkspaceSchedule } from '../schedule.workspace-view';
export { AccountCapabilityTabs, WorkspaceCapabilityTabs } from '../schedule-capability-tabs';
