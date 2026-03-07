/**
 * Module: timeline.workspace-view.tsx
 * Purpose: Workspace-level timeline page.
 * Responsibilities: consume workspace schedule data and render timeline canvas
 * Constraints: deterministic logic, respect module boundaries
 */

"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApp } from "@/app-runtime/providers/app-provider";
import { useWorkspace } from "@/features/workspace.slice";
import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { Input } from "@/shadcn-ui/input";
import { Label } from "@/shadcn-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shadcn-ui/select";
import { toast } from "@/shadcn-ui/hooks/use-toast";
import type { ScheduleItem, SkillRequirement, SkillTier } from "@/shared-kernel";
import { tagSlugRef } from "@/shared-kernel";
import { SKILLS } from "@/shared-kernel/constants/skills";

import { useTimelineCommands, useWorkspaceTimeline } from "../../hooks/runtime";

import { TimelineCanvas } from "./timeline-canvas";

const SKILL_TIER_OPTIONS: SkillTier[] = [
  "apprentice",
  "journeyman",
  "expert",
  "artisan",
  "grandmaster",
  "legendary",
  "titan",
];

function isSkillTier(value: string): value is SkillTier {
  return (SKILL_TIER_OPTIONS as string[]).includes(value);
}

export function WorkspaceTimeline() {
  const { workspace, items, organizationMembers, draggableTasks } = useWorkspaceTimeline();
  const { state: appState } = useApp();
  const { activeAccount } = appState;
  const { createScheduleItem } = useWorkspace();
  const { rescheduleItem } = useTimelineCommands();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskSkillOverrides, setTaskSkillOverrides] = useState<Record<string, SkillRequirement[]>>({});
  const [selectedSkillSlug, setSelectedSkillSlug] = useState("");
  const [selectedTier, setSelectedTier] = useState<SkillTier>("apprentice");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const activeEditorRef = useRef<HTMLDivElement | null>(null);

  const skillNameBySlug = useMemo(
    () => new Map(SKILLS.map((skill) => [skill.slug, skill.name])),
    []
  );

  const itemsById = useMemo(
    () => new Map<string, ScheduleItem>(items.map((item) => [item.id, item])),
    [items]
  );

  const handleMoveItem = useCallback(async ({ itemId, start, end }: { itemId: string; start: Date; end: Date }) => {
    const item = itemsById.get(itemId);
    if (!item) return false;
    return rescheduleItem(item, start, end);
  }, [itemsById, rescheduleItem]);

  const draggableTasksMap = useMemo(
    () => new Map(draggableTasks.map((task) => [task.id, task])),
    [draggableTasks]
  );

  const getTaskSkillRequirements = useCallback((taskId: string): SkillRequirement[] => {
    const override = taskSkillOverrides[taskId];
    if (override) return override;
    return draggableTasksMap.get(taskId)?.requiredSkills ?? [];
  }, [draggableTasksMap, taskSkillOverrides]);

  const handleTaskDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.setData("application/x-workspace-task", JSON.stringify({ taskId }));
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleOpenSkillEditor = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
    setSelectedSkillSlug("");
    setSelectedTier("apprentice");
    setSelectedQuantity("1");
  }, []);

  const handleAddSkillRequirement = useCallback(() => {
    if (!editingTaskId || !selectedSkillSlug) return;

    const existing = getTaskSkillRequirements(editingTaskId);
    const alreadyExists = existing.some((requirement) => requirement.tagSlug === selectedSkillSlug);
    if (alreadyExists) {
      toast({ variant: "destructive", title: "Skill already added" });
      return;
    }

    const quantity = Math.max(1, Number.parseInt(selectedQuantity, 10) || 1);
    const next: SkillRequirement = {
      tagSlug: tagSlugRef(selectedSkillSlug),
      minimumTier: selectedTier,
      quantity,
    };

    setTaskSkillOverrides((prev) => ({
      ...prev,
      [editingTaskId]: [...existing, next],
    }));

    setSelectedSkillSlug("");
    setSelectedTier("apprentice");
    setSelectedQuantity("1");
  }, [editingTaskId, getTaskSkillRequirements, selectedQuantity, selectedSkillSlug, selectedTier]);

  const handleRemoveSkillRequirement = useCallback((taskId: string, tagSlug: string) => {
    const existing = getTaskSkillRequirements(taskId);
    const next = existing.filter((requirement) => requirement.tagSlug !== tagSlug);

    setTaskSkillOverrides((prev) => ({
      ...prev,
      [taskId]: next,
    }));
  }, [getTaskSkillRequirements]);

  const handleDropTaskOnTimeline = useCallback(async ({ taskId, droppedAt }: { taskId: string; droppedAt: Date }) => {
    const task = draggableTasksMap.get(taskId);
    if (!task || !workspace.dimensionId) return false;

    const requiredSkills = getTaskSkillRequirements(taskId);
    if (requiredSkills.length === 0) {
      toast({
        variant: "destructive",
        title: "Skill Required",
        description: "Please add at least one required skill before scheduling this task.",
      });
      return false;
    }

    const result = await createScheduleItem({
      accountId: workspace.dimensionId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      title: task.name,
      description: task.description,
      status: 'PROPOSAL',
      originType: 'TASK_AUTOMATION',
      originTaskId: task.id,
      assigneeIds: task.assigneeId ? [String(task.assigneeId)] : [],
      location: task.location,
      requiredSkills,
      proposedBy: activeAccount?.id,
      startDate: droppedAt,
    });

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Add to Timeline Failed',
        description: result.error.message,
      });
      return false;
    }

    toast({
      title: 'Task Added',
      description: `"${task.name}" has been scheduled.`,
    });

    setEditingTaskId((current) => (current === taskId ? null : current));
    return true;
  }, [activeAccount?.id, createScheduleItem, draggableTasksMap, getTaskSkillRequirements, workspace.dimensionId, workspace.id, workspace.name]);

  useEffect(() => {
    if (!editingTaskId) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Keep editor open while interacting with radix popover/select content.
      if (target.closest("[data-radix-popper-content-wrapper]")) {
        return;
      }

      if (activeEditorRef.current?.contains(target)) {
        return;
      }

      setEditingTaskId(null);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [editingTaskId]);

  return (
    <div className="space-y-4">
      <TimelineCanvas
        items={items}
        members={organizationMembers}
        enableDrag
        onMoveItem={handleMoveItem}
        onDropTask={handleDropTaskOnTimeline}
        className="min-h-[560px]"
      />

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Unscheduled Tasks</h3>
          <Badge variant="outline" className="text-[10px]">Drag into timeline to create</Badge>
        </div>

        {draggableTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">All active tasks are already scheduled.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {draggableTasks.map((task) => (
              <div key={task.id} className="rounded-lg border bg-background px-3 py-2 text-sm">
                <div
                  draggable
                  onDragStart={(event) => handleTaskDragStart(event, task.id)}
                  className="flex cursor-grab items-start gap-2"
                >
                  <GripVertical className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{task.name}</p>
                    {task.description ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    draggable={false}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleOpenSkillEditor(task.id);
                    }}
                    className="size-7"
                    aria-label="Add skill requirement"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                {getTaskSkillRequirements(task.id).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {getTaskSkillRequirements(task.id).map((requirement) => (
                      <Badge key={`${task.id}-${requirement.tagSlug}`} variant="secondary" className="gap-1 text-[10px]">
                        <span>
                          {skillNameBySlug.get(requirement.tagSlug) ?? requirement.tagSlug}
                          {` · ${requirement.minimumTier} · x${requirement.quantity}`}
                        </span>
                        <button
                          type="button"
                          className="inline-flex"
                          onClick={() => handleRemoveSkillRequirement(task.id, requirement.tagSlug)}
                          aria-label="Remove skill requirement"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-amber-600">Skill configuration is required before scheduling.</p>
                )}

                {editingTaskId === task.id ? (
                  <div ref={activeEditorRef} className="mt-3 grid gap-2 rounded-md border bg-muted/20 p-2">
                    <div className="grid gap-1">
                      <Label className="text-[11px]">Skill</Label>
                      <Select value={selectedSkillSlug} onValueChange={setSelectedSkillSlug}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILLS.map((skill) => (
                            <SelectItem key={skill.slug} value={skill.slug} className="text-xs">
                              {skill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label className="text-[11px]">Tier</Label>
                        <Select
                          value={selectedTier}
                          onValueChange={(value) => {
                            if (isSkillTier(value)) {
                              setSelectedTier(value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_TIER_OPTIONS.map((tier) => (
                              <SelectItem key={tier} value={tier} className="text-xs capitalize">
                                {tier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1">
                        <Label className="text-[11px]">Qty</Label>
                        <Input
                          className="h-8 text-xs"
                          inputMode="numeric"
                          value={selectedQuantity}
                          onChange={(event) => setSelectedQuantity(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTaskId(null)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={handleAddSkillRequirement}>
                        Add Skill
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
