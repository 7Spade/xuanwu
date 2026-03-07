"use client";

/**
 * Module: schedule-capability-tabs.tsx
 * Purpose: Provide schedule/timeline capability tabs for account and workspace routes.
 * Responsibilities: route-aware active tab and navigation.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useParams, usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/shadcn-ui/tabs";

type CapabilityTabValue = "schedule" | "timeline";

function toCapabilityValue(pathname: string): CapabilityTabValue {
  return pathname.endsWith("/timeline") ? "timeline" : "schedule";
}

/**
 * @deprecated AccountCapabilityTabs is no longer rendered by any route.
 * The unified WorkforceSchedulingPage at /dashboard/account/workforce-scheduling
 * manages schedule/timeline switching with in-page state.
 * This export is kept to avoid a breaking public-API change.
 */
export function AccountCapabilityTabs() {
  return null;
}

export function WorkspaceCapabilityTabs() {
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
