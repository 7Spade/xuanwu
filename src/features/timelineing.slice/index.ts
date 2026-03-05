/**
 * Module: index.ts
 * Purpose: Public API for timelineing.slice.
 * Responsibilities: expose timeline views, hooks, actions, and capability tabs
 * Constraints: deterministic logic, respect module boundaries
 */

export { AccountTimelineSection } from "./_components/timeline.account-view";
export { WorkspaceTimeline } from "./_components/timeline.workspace-view";
export {
	AccountTimelineCapabilityTabs,
	WorkspaceTimelineCapabilityTabs,
} from "./_components/timeline-capability-tabs";
export { updateTimelineItemDateRange } from "./_actions";
export {
	useAccountTimeline,
	useWorkspaceTimeline,
	useTimelineCommands,
} from "./_hooks";
