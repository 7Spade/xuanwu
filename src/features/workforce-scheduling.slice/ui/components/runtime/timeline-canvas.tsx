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

import { cn } from "@/shadcn-ui/utils/utils";
import type { ScheduleItem } from "@/shared-kernel";

import type { TimelineMember } from '../../types/timeline.types';
import {
  escapeHtml,
  resolveInitialWindow,
  resolveTimelineInterval,
  toTimelineClassName,
} from "./timeline-canvas.helpers";

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
  onDropTask?: (params: {
    taskId: string;
    droppedAt: Date;
  }) => Promise<boolean>;
  className?: string;
}


export function TimelineCanvas({
  items,
  members,
  enableDrag = false,
  groupMode = "none",
  onMoveItem,
  onDropTask,
  className,
}: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const onMoveItemRef = useRef(onMoveItem);
  const onDropTaskRef = useRef(onDropTask);

  useEffect(() => {
    onMoveItemRef.current = onMoveItem;
  }, [onMoveItem]);

  useEffect(() => {
    onDropTaskRef.current = onDropTask;
  }, [onDropTask]);

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

    const container = containerRef.current;

    const handleDragOver = (event: DragEvent) => {
      if (!event.dataTransfer) return;
      if (event.dataTransfer.types.includes("application/x-workspace-task")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (event: DragEvent) => {
      if (!event.dataTransfer) return;

      const payload = event.dataTransfer.getData("application/x-workspace-task");
      if (!payload) return;

      event.preventDefault();

      let parsed: { taskId?: string } | null = null;
      try {
        parsed = JSON.parse(payload) as { taskId?: string };
      } catch {
        return;
      }

      if (!parsed?.taskId) return;

      const timelineInstance = timelineRef.current;
      const dropHandler = onDropTaskRef.current;
      if (!timelineInstance || !dropHandler) return;

      const eventProps = timelineInstance.getEventProperties(event as unknown as Event);
      const dropTime = eventProps.time;
      if (!(dropTime instanceof Date) || Number.isNaN(dropTime.getTime())) return;

      await dropHandler({
        taskId: parsed.taskId,
        droppedAt: dropTime,
      });
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);

    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
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
