/**
 * Module: _components/timeline-view/index.ts
 * Purpose: Re-export barrel for the TimelineView (vis-timeline canvas).
 * Responsibilities: expose timeline components under the TimelineView namespace.
 * Constraints: deterministic logic, respect module boundaries
 *
 * Corresponds to the original timelineing.slice timeline components.
 */

export { AccountTimelineSection } from '../timeline.account-view';
export { WorkspaceTimeline } from '../timeline.workspace-view';
export { AccountCapabilityTabs, WorkspaceCapabilityTabs } from '../schedule-capability-tabs';
