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
import { SKILLS } from "@/shared-kernel/constants/skills";

import type { TimelineMember } from '../../types/timeline.types';
import styles from "./timeline-canvas.module.css";
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

interface TimelineRenderableItem extends DataItem {
  taskTitle?: string;
  skillRequirements?: DisplaySkillRequirement[];
}

interface DisplaySkillRequirement {
  skillName: string;
  quantity: number;
}

function formatSkillRequirements(item: ScheduleItem, skillNameBySlug: Map<string, string>): DisplaySkillRequirement[] {
  const requirements = item.requiredSkills ?? [];
  if (requirements.length === 0) {
    return [{ skillName: "Not Set", quantity: 0 }];
  }

  return requirements.map((requirement) => {
    const skillName = skillNameBySlug.get(requirement.tagSlug) ?? requirement.tagSlug;
    const quantity = Math.max(1, requirement.quantity ?? 1);
    return { skillName, quantity };
  });
}

function createIconBadge(label: string, background: string, color: string): HTMLSpanElement {
  const icon = document.createElement("span");
  icon.textContent = label;
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.width = "14px";
  icon.style.height = "14px";
  icon.style.borderRadius = "9999px";
  icon.style.background = background;
  icon.style.color = color;
  icon.style.fontSize = "9px";
  icon.style.fontWeight = "700";
  icon.style.lineHeight = "1";
  icon.style.flexShrink = "0";
  return icon;
}

function applyMarqueeIfOverflow(viewport: HTMLSpanElement, track: HTMLSpanElement): void {
  const update = () => {
    if (!viewport.isConnected || !track.isConnected) return;

    const overflowWidth = track.scrollWidth - viewport.clientWidth;
    if (overflowWidth > 2) {
      const durationSeconds = Math.max(6, Math.min(18, overflowWidth / 22));
      track.classList.add(styles.marqueeTrackAnimated);
      track.style.setProperty("--marquee-distance", `${overflowWidth}px`);
      track.style.setProperty("--marquee-duration", `${durationSeconds}s`);
      return;
    }

    track.classList.remove(styles.marqueeTrackAnimated);
    track.style.removeProperty("--marquee-distance");
    track.style.removeProperty("--marquee-duration");
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(update);
  });
}

function createMarqueeText(value: string, color?: string): { viewport: HTMLSpanElement; track: HTMLSpanElement } {
  const track = document.createElement("span");
  track.textContent = value;
  track.className = styles.marqueeTrack;
  if (color) {
    track.style.color = color;
  }

  const viewport = document.createElement("span");
  viewport.className = styles.marqueeViewport;
  viewport.appendChild(track);

  applyMarqueeIfOverflow(viewport, track);

  return { viewport, track };
}

function buildTimelineItemElement(taskTitle: string, skillRequirements: DisplaySkillRequirement[]): HTMLElement {
  const root = document.createElement("div");
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "2px";
  root.style.whiteSpace = "normal";
  root.style.width = "100%";
  root.style.maxWidth = "100%";
  root.style.minWidth = "0";
  root.style.overflow = "hidden";

  const titleRow = document.createElement("div");
  titleRow.style.display = "grid";
  titleRow.style.gridTemplateColumns = "14px minmax(0, 1fr)";
  titleRow.style.alignItems = "center";
  titleRow.style.gap = "6px";
  titleRow.style.fontWeight = "600";
  titleRow.style.lineHeight = "1.2";
  titleRow.style.color = "#0f172a";
  titleRow.style.minWidth = "0";
  titleRow.appendChild(createIconBadge("T", "#dbeafe", "#1d4ed8"));

  const { viewport: titleViewport } = createMarqueeText(taskTitle);

  titleRow.appendChild(titleViewport);
  root.appendChild(titleRow);

  for (const requirement of skillRequirements) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "14px minmax(0, 1fr) auto";
    row.style.alignItems = "center";
    row.style.gap = "6px";
    row.style.lineHeight = "1.2";
    row.style.minWidth = "0";

    row.appendChild(createIconBadge("S", "#dcfce7", "#15803d"));

    const { viewport: skillViewport } = createMarqueeText(requirement.skillName, "#166534");
    row.appendChild(skillViewport);

    const peopleWrap = document.createElement("span");
    peopleWrap.style.display = "inline-flex";
    peopleWrap.style.alignItems = "center";
    peopleWrap.style.gap = "4px";
    peopleWrap.style.color = "#6b21a8";
    peopleWrap.style.flexShrink = "0";

    peopleWrap.appendChild(createIconBadge("P", "#f3e8ff", "#7e22ce"));

    const peopleCount = document.createElement("span");
    peopleCount.textContent = requirement.quantity > 0 ? String(requirement.quantity) : "-";
    peopleWrap.appendChild(peopleCount);

    row.appendChild(peopleWrap);
    root.appendChild(row);
  }

  return root;
}

function buildTimelineItemTitle(item: ScheduleItem, skillRequirements: DisplaySkillRequirement[], assigneeNames: string): string {
  const skillLines = skillRequirements.map((requirement) => `Skill: ${requirement.skillName} | People: ${requirement.quantity > 0 ? requirement.quantity : "-"}`);
  const baseLines = [item.title, ...skillLines];
  if (assigneeNames) {
    baseLines.push(`Assignees: ${assigneeNames}`);
  }
  return baseLines.join("\n");
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
  const skillNameBySlug = useMemo(() => new Map(SKILLS.map((skill) => [skill.slug, skill.name])), []);

  const timelineItems = useMemo(() => {
    return items
      .map((item): DataItem | null => {
        const interval = resolveTimelineInterval(item);
        if (!interval) return null;
        const assigneeNames = item.assigneeIds.map((id) => membersMap.get(id)).filter(Boolean).join(", ");
        const skillRequirements = formatSkillRequirements(item, skillNameBySlug);
        const titleText = buildTimelineItemTitle(item, skillRequirements, assigneeNames);

        const timelineItem: TimelineRenderableItem = {
          id: item.id,
          content: item.title,
          taskTitle: item.title,
          skillRequirements,
          start: interval.start,
          end: interval.end,
          type: interval.type,
          group: groupMode === "workspace" ? item.workspaceId : undefined,
          title: escapeHtml(titleText),
          className: toTimelineClassName(item),
        };

        return timelineItem;
      })
      .filter((item): item is DataItem => item !== null);
  }, [groupMode, items, membersMap, skillNameBySlug]);

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
    let isEffectActive = true;

    const dataSet = new DataSet<DataItem>(timelineItems);
    const groupDataSet = timelineGroups ? new DataSet<DataGroup>(timelineGroups) : undefined;

    const options: TimelineOptions & { throttleRedraw?: number } = {
      stack: true,
      groupHeightMode: "fitItems",
      verticalScroll: true,
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
      template: (rawItem) => {
        const item = rawItem as TimelineRenderableItem | undefined;
        const taskTitle = typeof item?.taskTitle === "string" ? item.taskTitle : "Untitled";
        const skillRequirements = Array.isArray(item?.skillRequirements) ? item.skillRequirements : [];
        return buildTimelineItemElement(taskTitle, skillRequirements);
      },
      onMove: (movedItem: TimelineItem, callback) => {
        const startDate = new Date(movedItem.start);
        const endDate = movedItem.end ? new Date(movedItem.end) : new Date(startDate);

        const moveHandler = onMoveItemRef.current;

        if (!moveHandler) {
          if (isEffectActive) {
            callback(movedItem);
          }
          return;
        }

        moveHandler({
          itemId: String(movedItem.id),
          start: startDate,
          end: endDate,
          groupId: movedItem.group != null ? String(movedItem.group) : undefined,
        })
          .then((ok) => {
            if (!isEffectActive) return;
            callback(ok ? movedItem : null);
          })
          .catch(() => {
            if (!isEffectActive) return;
            callback(null);
          });
      },
    };

    const timeline = groupDataSet
      ? new Timeline(containerRef.current, dataSet, groupDataSet, options)
      : new Timeline(containerRef.current, dataSet, options);
    timelineRef.current = timeline;

    let redrawFrame: number | null = null;
    const scheduleRedraw = () => {
      if (!isEffectActive) return;
      if (redrawFrame !== null) {
        cancelAnimationFrame(redrawFrame);
      }
      redrawFrame = requestAnimationFrame(() => {
        redrawFrame = null;
        if (!isEffectActive) return;
        timeline.redraw();
      });
    };

    timeline.on("rangechanged", scheduleRedraw);

    // Recalculate stacked item heights after template DOM is mounted.
    scheduleRedraw();

    const container = containerRef.current;
    const resizeObserver = new ResizeObserver(() => {
      scheduleRedraw();
    });
    resizeObserver.observe(container);

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
      isEffectActive = false;
      timeline.off("rangechanged", scheduleRedraw);
      resizeObserver.disconnect();
      if (redrawFrame !== null) {
        cancelAnimationFrame(redrawFrame);
      }
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [enableDrag, groupMode, initialWindow.end, initialWindow.start, timelineGroups, timelineItems]);

  return (
    <div className={cn("relative min-h-[520px] rounded-xl border bg-card p-3", className)}>
      <div ref={containerRef} className="min-h-[500px] w-full" />
    </div>
  );
}
