/**
 * Module: timeline-canvas.tsx
 * Purpose: Render schedule items as a vis timeline.
 * Responsibilities: transform schedule items and mount vis Timeline safely
 * Constraints: deterministic logic, respect module boundaries
 */

"use client";

import { useEffect, useMemo, useRef } from "react";
import { DataSet } from "vis-data";
import {
  Timeline,
  type DataGroup,
  type DataItem,
  type TimelineItem,
  type TimelineOptions,
} from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

import type { ScheduleItem, Timestamp } from "@/features/shared-kernel";
import { cn } from "@/shared/shadcn-ui/utils/utils";

import type { TimelineMember } from "../_types";

type CalendarTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number } | null | undefined;

interface TimelineCanvasProps {
  items: ScheduleItem[];
  members: TimelineMember[];
  enableDrag?: boolean;
  groupMode?: "none" | "workspace";
  onMoveItem?: (params: {
    itemId: string;
    start: Date;
    end: Date;
    groupId?: string;
  }) => Promise<boolean>;
  className?: string;
}

function toDate(timestamp: CalendarTimestamp): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof (timestamp as Timestamp).toDate === "function") return (timestamp as Timestamp).toDate();
  if (typeof (timestamp as { seconds: number }).seconds === "number") {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }
  return null;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toTimelineClassName(item: ScheduleItem): string {
  switch (item.status) {
    case "PROPOSAL":
      return "bg-primary/10 border-primary/40";
    case "OFFICIAL":
      return "bg-emerald-500/10 border-emerald-500/40";
    case "COMPLETED":
      return "bg-muted border-muted-foreground/30";
    case "REJECTED":
      return "bg-destructive/10 border-destructive/40";
    default:
      return "bg-background border-border";
  }
}

export function TimelineCanvas({
  items,
  members,
  enableDrag = false,
  groupMode = "none",
  onMoveItem,
  className,
}: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);

  const membersMap = useMemo(() => new Map(members.map((member) => [member.id, member.name])), [members]);

  const timelineItems = useMemo(() => {
    return items
      .map((item): DataItem | null => {
        const start = toDate(item.startDate);
        const end = toDate(item.endDate);
        if (!start && !end) return null;

        const normalizedStart = start ?? end!;
        const normalizedEnd = end ?? start ?? undefined;
        const assigneeNames = item.assigneeIds.map((id) => membersMap.get(id)).filter(Boolean).join(", ");

        const titleText = assigneeNames
          ? `${item.title}\n${assigneeNames}`
          : item.title;

        return {
          id: item.id,
          content: escapeHtml(item.title),
          start: normalizedStart,
          end: normalizedEnd,
          group: groupMode === "workspace" ? item.workspaceId : undefined,
          title: escapeHtml(titleText),
          className: toTimelineClassName(item),
        };
      })
      .filter((item): item is DataItem => item !== null);
  }, [groupMode, items, membersMap]);

  const timelineGroups = useMemo<DataGroup[] | undefined>(() => {
    if (groupMode !== "workspace") return undefined;

    const seen = new Set<string>();
    const groups: DataGroup[] = [];
    for (const item of items) {
      if (seen.has(item.workspaceId)) continue;
      seen.add(item.workspaceId);
      groups.push({
        id: item.workspaceId,
        content: escapeHtml(item.workspaceName ?? item.workspaceId),
        title: escapeHtml(item.workspaceName ?? item.workspaceId),
      });
    }
    return groups;
  }, [groupMode, items]);

  useEffect(() => {
    if (!containerRef.current) return;

    const dataSet = new DataSet<DataItem>(timelineItems);
    const groupDataSet = timelineGroups ? new DataSet<DataGroup>(timelineGroups) : undefined;

    const options: TimelineOptions = {
      stack: true,
      selectable: true,
      moveable: enableDrag,
      editable: enableDrag ? { updateTime: true, updateGroup: groupMode === "workspace" } : false,
      zoomMin: 1000 * 60 * 60,
      zoomMax: 1000 * 60 * 60 * 24 * 365,
      margin: { item: 12, axis: 8 },
      orientation: { axis: "top" },
      showCurrentTime: true,
      groupOrder: "content",
      onMove: (movedItem: TimelineItem, callback) => {
        const startDate = new Date(movedItem.start);
        const endDate = movedItem.end ? new Date(movedItem.end) : new Date(startDate);

        if (!onMoveItem) {
          callback(movedItem);
          return;
        }

        onMoveItem({
          itemId: String(movedItem.id),
          start: startDate,
          end: endDate,
          groupId: movedItem.group != null ? String(movedItem.group) : undefined,
        })
          .then((ok) => {
            callback(ok ? movedItem : null);
          })
          .catch(() => callback(null));
      },
    };

    const timeline = groupDataSet
      ? new Timeline(containerRef.current, dataSet, groupDataSet, options)
      : new Timeline(containerRef.current, dataSet, options);
    timelineRef.current = timeline;

    return () => {
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [enableDrag, groupMode, onMoveItem, timelineGroups, timelineItems]);

  return (
    <div className={cn("relative min-h-[520px] overflow-hidden rounded-xl border bg-card p-3", className)}>
      <div ref={containerRef} className="h-[500px] w-full" />
    </div>
  );
}
