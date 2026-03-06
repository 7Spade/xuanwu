"use client";

/**
 * Module: timeline-capability-tabs.tsx
 * Purpose: Timeline capability tab switchers for account/workspace routes.
 * Responsibilities: route-aware schedule/timeline tab navigation.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useParams, usePathname, useRouter } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger } from '@/shared/shadcn-ui/tabs';

const ACCOUNT_SCHEDULE_PATH = '/dashboard/account/schedule';
const ACCOUNT_TIMELINE_PATH = '/dashboard/account/timeline';

type CapabilityTabValue = 'schedule' | 'timeline';

function toCapabilityValue(pathname: string): CapabilityTabValue {
  return pathname.endsWith('/timeline') ? 'timeline' : 'schedule';
}

export function AccountTimelineCapabilityTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Tabs
      value={toCapabilityValue(pathname)}
      onValueChange={(value) => {
        const nextPath = value === 'timeline' ? ACCOUNT_TIMELINE_PATH : ACCOUNT_SCHEDULE_PATH;
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

export function WorkspaceTimelineCapabilityTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id;

  return (
    <Tabs
      value={toCapabilityValue(pathname)}
      onValueChange={(value) => {
        const nextPath = value === 'timeline'
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
