import { WorkspaceCapabilityTabs, WorkspaceSchedule } from "@/features/workforce-scheduling.slice"

/**
 * Module: page.tsx
 * Purpose: Workspace schedule capability route.
 * Responsibilities: mount capability tabs and workspace schedule view.
 * Constraints: deterministic logic, respect module boundaries
 */

export default function ScheduleCapabilityPage() {
  return (
    <div>
      <WorkspaceCapabilityTabs />
      <WorkspaceSchedule />
    </div>
  )
}
