import {
  WorkspaceTimeline,
  WorkspaceTimelineCapabilityTabs,
} from "@/features/timelineing.slice";

/**
 * Module: page.tsx
 * Purpose: Workspace timeline capability route.
 * Responsibilities: mount capability tabs and workspace timeline view.
 * Constraints: deterministic logic, respect module boundaries
 */

export default function TimelineCapabilityPage() {
  return (
    <div>
      <WorkspaceTimelineCapabilityTabs />
      <WorkspaceTimeline />
    </div>
  );
}
