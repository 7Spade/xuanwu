/**
 * Module: timeline.workspace-view.tsx
 * Purpose: Workspace-level timeline page.
 * Responsibilities: consume workspace schedule data and render timeline canvas
 * Constraints: deterministic logic, respect module boundaries
 */

"use client";

import { Clock3 } from "lucide-react";

import type { ScheduleItem } from "@/features/shared-kernel";

import { useTimelineCommands, useWorkspaceTimeline } from "../_hooks";

import { TimelineCanvas } from "./timeline-canvas";

export function WorkspaceTimeline() {
  const { workspace, items, organizationMembers } = useWorkspaceTimeline();
  const { rescheduleItem } = useTimelineCommands();

  const itemsById = new Map<string, ScheduleItem>(items.map((item) => [item.id, item]));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-headline text-2xl font-bold tracking-tight">Workspace Timeline</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="size-4" />
          以時序方式檢視 {workspace.name} 的排程項目。
        </p>
      </div>

      <TimelineCanvas
        items={items}
        members={organizationMembers}
        enableDrag
        onMoveItem={async ({ itemId, start, end }) => {
          const item = itemsById.get(itemId);
          if (!item) return false;
          return rescheduleItem(item, start, end);
        }}
        className="min-h-[560px]"
      />
    </div>
  );
}
