/**
 * Module: workspace-schedule-timeline-tabs.tsx
 * Purpose: Provide a single route-aware schedule/timeline tab implementation.
 * Responsibilities: render tabs and push route changes for workspace capability pages.
 * Constraints: deterministic logic, respect module boundaries
 */
"use client";

import { useParams, usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/shadcn-ui/tabs";

type CapabilityTabValue = "schedule" | "timeline";

function toCapabilityValue(pathname: string): CapabilityTabValue {
  return pathname.endsWith("/timeline") ? "timeline" : "schedule";
}

export function WorkspaceScheduleTimelineTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id;

  return (
    <Tabs
      value={toCapabilityValue(pathname)}
      onValueChange={(value) => {
        const nextPath = value === "timeline"
          ? `/workspaces/${workspaceId}/timeline`
          : `/workspaces/${workspaceId}/schedule`;
        router.push(nextPath);
      }}
      className="mb-4"
    >
      <TabsList>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
