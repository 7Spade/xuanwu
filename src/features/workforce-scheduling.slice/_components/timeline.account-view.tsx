/**
 * Module: timeline.account-view.tsx
 * Purpose: Organization account-level timeline page.
 * Responsibilities: consume global schedule data and render timeline canvas
 * Constraints: deterministic logic, respect module boundaries
 */

"use client";

import { AlertCircle, Clock3 } from "lucide-react";
import { useCallback, useMemo } from "react";

import type { ScheduleItem } from "@/shared-kernel";
import { useApp } from "@/shared/app-providers/app-context";

import { useAccountTimeline, useTimelineCommands } from "../_hooks";

import { TimelineCanvas } from "./timeline-canvas";

export function AccountTimelineSection() {
  const { state } = useApp();
  const { activeAccount } = state;
  const { items, organizationMembers } = useAccountTimeline();
  const { rescheduleItem } = useTimelineCommands();

  const itemsById = useMemo(
    () => new Map<string, ScheduleItem>(items.map((item) => [item.id, item])),
    [items]
  );

  const handleMoveItem = useCallback(async ({ itemId, start, end }: { itemId: string; start: Date; end: Date }) => {
    const item = itemsById.get(itemId);
    if (!item) return false;
    return rescheduleItem(item, start, end);
  }, [itemsById, rescheduleItem]);

  if (activeAccount?.accountType !== "organization") {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertCircle className="size-10 text-muted-foreground" />
        <h3 className="font-bold">Timeline Not Available</h3>
        <p className="text-sm text-muted-foreground">
          組ç?層ç???Timeline ?…在 organization 維度?¯使?¨ã€?
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-full flex-col gap-6 duration-700 animate-in fade-in">
      <div className="space-y-1">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Organization Timeline</h1>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock3 className="size-4" />
          使用 vis timeline ?ˆ現?¨ç?織æ?程æ?序ã€?
        </p>
      </div>

      <TimelineCanvas
        items={items}
        members={organizationMembers}
        groupMode="workspace"
        enableDrag
        onMoveItem={handleMoveItem}
      />
    </div>
  );
}
