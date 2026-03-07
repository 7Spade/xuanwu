/**
 * Module: timeline-canvas.tsx
 * Purpose: Render schedule items as a vis timeline.
 * Responsibilities: transform schedule items and mount vis Timeline safely
 * Constraints: deterministic logic, respect module boundaries
 */

"use client";

import { addDays, addMinutes, isSameDay, startOfDay } from "date-fns";
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

import { cn } from "@/shadcn-ui/utils/utils";
import type { ScheduleItem, Timestamp } from "@/shared-kernel";

import type { TimelineMember } from '../_timeline.types';

type CalendarTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number } | null | undefined;
type ResolvedTemporalKind = NonNullable<ScheduleItem["temporalKind"]>;

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

function isStartOfDay(date: Date): boolean {
  return (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

function inferTemporalKind(start: Date, end?: Date, explicitKind?: ScheduleItem["temporalKind"]): ResolvedTemporalKind {
  if (explicitKind) return explicitKind;
  if (!end) return "point";

  if (end.getTime() === start.getTime()) {
    if (isSameDay(start, end) && isStartOfDay(start) && isStartOfDay(end)) {
      return "allDay";
    }
    return "point";
  }

  if (end.getTime() > start.getTime()) return "range";
  return "point";
}

function resolveTimelineInterval(item: ScheduleItem): {
  temporalKind: ResolvedTemporalKind;
  start: Date;
  end?: Date;
  type: "box" | "range";
} | null {
  const startValue = toDate(item.startDate);
  const endValue = toDate(item.endDate);
  if (!startValue && !endValue) return null;

  const baseStart = startValue ?? endValue!;
  const baseEnd = endValue ?? startValue ?? undefined;
  const kind = inferTemporalKind(baseStart, baseEnd, item.temporalKind);

  if (kind === "point") {
    return {
      temporalKind: kind,
      start: baseStart,
      type: "box",
    };
  }

  if (kind === "allDay") {
    const normalizedStart = startOfDay(baseStart);
    const normalizedEnd = baseEnd && baseEnd.getTime() > normalizedStart.getTime()
      ? baseEnd
      : addDays(normalizedStart, 1);

    return {
      temporalKind: kind,
      start: normalizedStart,
      end: normalizedEnd,
      type: "range",
    };
  }

  const normalizedEnd = baseEnd && baseEnd.getTime() > baseStart.getTime()
    ? baseEnd
    : addMinutes(baseStart, 30);

  return {
    temporalKind: kind,
    start: baseStart,
    end: normalizedEnd,
    type: "range",
  };
}

function resolveInitialWindow(items: DataItem[]): { start: Date; end: Date } {
  const now = new Date();
  if (items.length === 0) {
    return {
      start: addDays(now, -3),
      end: addDays(now, 10),
    };
  }

  const itemStarts = items
    .map((item) => {
      const value = item.start;
      return value instanceof Date ? value : new Date(value);
    })
    .sort((left, right) => left.getTime() - right.getTime());

  const nearest = itemStarts.reduce((best, current) => {
    const currentDistance = Math.abs(current.getTime() - now.getTime());
    const bestDistance = Math.abs(best.getTime() - now.getTime());
    return currentDistance < bestDistance ? current : best;
  }, itemStarts[0]);

  return {
    start: addDays(nearest, -3),
    end: addDays(nearest, 10),
  };
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
  const onMoveItemRef = useRef(onMoveItem);

  useEffect(() => {
    onMoveItemRef.current = onMoveItem;
  }, [onMoveItem]);

  const membersMap = useMemo(() => new Map(members.map((member) => [member.id, member.name])), [members]);

  const timelineItems = useMemo(() => {
    return items
      .map((item): DataItem | null => {
        const interval = resolveTimelineInterval(item);
        if (!interval) return null;
        const assigneeNames = item.assigneeIds.map((id) => membersMap.get(id)).filter(Boolean).join(", ");

        const titleText = assigneeNames
          ? `${item.title}\n${assigneeNames}`
          : item.title;

        return {
          id: item.id,
          content: escapeHtml(item.title),
          start: interval.start,
          end: interval.end,
          type: interval.type,
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

  const initialWindow = useMemo(() => resolveInitialWindow(timelineItems), [timelineItems]);

  useEffect(() => {
    if (!containerRef.current) return;

    const dataSet = new DataSet<DataItem>(timelineItems);
    const groupDataSet = timelineGroups ? new DataSet<DataGroup>(timelineGroups) : undefined;

    const options: TimelineOptions & { throttleRedraw?: number } = {
      stack: true,
      selectable: true,
      moveable: enableDrag,
      editable: enableDrag ? { updateTime: true, updateGroup: groupMode === "workspace" } : false,
      start: initialWindow.start,
      end: initialWindow.end,
      zoomMin: 1000 * 60 * 15,
      zoomMax: 1000 * 60 * 60 * 24 * 90,
      zoomFriction: 8,
      throttleRedraw: 32,
      timeAxis: { scale: "day", step: 1 },
      snap: null,
      margin: { item: 12, axis: 8 },
      orientation: { axis: "top" },
      showCurrentTime: false,
      groupOrder: "content",
      onMove: (movedItem: TimelineItem, callback) => {
        const startDate = new Date(movedItem.start);
        const endDate = movedItem.end ? new Date(movedItem.end) : new Date(startDate);

        const moveHandler = onMoveItemRef.current;

        if (!moveHandler) {
          callback(movedItem);
          return;
        }

        moveHandler({
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
  }, [enableDrag, groupMode, initialWindow.end, initialWindow.start, timelineGroups, timelineItems]);

  return (
    <div className={cn("relative min-h-[520px] overflow-hidden rounded-xl border bg-card p-3", className)}>
      <div ref={containerRef} className="h-[500px] w-full" />
    </div>
  );
}
