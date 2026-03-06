"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, MapPin, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { type DateRange } from "react-day-picker";

import type { SkillRequirement } from "@/shared-kernel";
import { tagSlugRef } from "@/shared-kernel";
import { getOrgSkillTags } from "@/features/skill-xp.slice";
import { type Location } from "@/features/workspace.slice";
import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared/constants/skills";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Calendar } from "@/shared/shadcn-ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { cn } from "@/shared/shadcn-ui/utils/utils";

const MAX_SKILL_REQUIREMENT_QUANTITY = 99;

interface ProposalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: {
    taskId?: string;
    title: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
    location: Location;
    requiredSkills: SkillRequirement[];
  }) => Promise<void>;
  initialDate: Date;
  /** FR-K5: Org ID used to load the org's skill tag pool instead of the global library. */
  orgId?: string;
  inheritedTitle?: string;
  inheritedTaskId?: string;
  inheritedLocation?: Location;
  initialRequiredSkills?: SkillRequirement[];
  taskOptions?: Array<{
    id: string;
    name: string;
    location?: Location;
    requiredSkills?: SkillRequirement[];
  }>;
}

/**
 * @fileoverview ProposalDialog - A dedicated dialog component for creating schedule proposals.
 * @description This is a "dumb" component that receives its state and callbacks via props.
 * It encapsulates the entire form logic for submitting a new schedule item.
 * The requiredSkills section connects to SKILL_TAG_POOL (skill-xp.slice)
 * so that schedule proposals can specify staffing skill requirements.
 * FR-K5: When orgId is provided, loads the org's tag pool; otherwise falls back to global SKILLS.
 */
export function ProposalDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialDate,
  orgId,
  inheritedTitle,
  inheritedTaskId,
  inheritedLocation,
  initialRequiredSkills,
  taskOptions = [],
}: ProposalDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [location, setLocation] = useState<Location>({ description: '' });
  const [requiredSkills, setRequiredSkills] = useState<SkillRequirement[]>([]);
  const [selectedSkillSlug, setSelectedSkillSlug] = useState("");
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const isTaskInheritedMode = Boolean(inheritedTitle);

  // FR-K5: Org skill tag pool ??loaded once per dialog open when orgId is provided.
  const [skillOptions, setSkillOptions] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setDateRange({ from: initialDate, to: initialDate });
    setSelectedTaskId(inheritedTaskId ?? "");
    setTaskPickerOpen(false);
    setTitle(inheritedTitle ?? "");
    setDescription("");
    setLocation(inheritedLocation ?? { description: '' });
    setRequiredSkills(initialRequiredSkills ?? []);
    setSelectedSkillSlug("");
    setSkillPickerOpen(false);
    setSelectedQuantity("1");

    if (orgId) {
      getOrgSkillTags(orgId)
        .then((tags) => {
          if (tags.length > 0) {
            setSkillOptions(tags.map((t) => ({ slug: t.tagSlug, name: t.tagName ?? t.tagSlug })));
          } else {
            // Fallback to global skills list when org pool is empty
            setSkillOptions(SKILLS.map((s) => ({ slug: s.slug, name: s.name })));
          }
        })
        .catch(() => setSkillOptions(SKILLS.map((s) => ({ slug: s.slug, name: s.name }))));
    } else {
      setSkillOptions(SKILLS.map((s) => ({ slug: s.slug, name: s.name })));
    }
  }, [isOpen, initialDate, orgId, inheritedTitle, inheritedTaskId, inheritedLocation, initialRequiredSkills]);

  const selectedTaskOption = useMemo(
    () => taskOptions.find((option) => option.id === selectedTaskId),
    [taskOptions, selectedTaskId]
  );

  // Pre-compute a slug ??SkillDefinition map for O(1) lookups in the grouped picker.
  const skillBySlug = useMemo(
    () => new Map(SKILLS.map(s => [s.slug, s])),
    []
  );

  // Pre-compute grouped structure: group ??subCategory ??skillOptions entries.
  const groupedSkillOptions = useMemo(() => {
    return SKILL_GROUPS.map(group => {
      const subCategoryEntries = group.subCategories.flatMap(subCatKey => {
        const subCatMeta = SKILL_SUB_CATEGORY_BY_KEY.get(subCatKey);
        const subSkills = skillOptions.filter(s => {
          const def = skillBySlug.get(s.slug);
          return def?.group === group.group && def?.subCategory === subCatKey;
        });
        return subSkills.map(skill => ({
          slug: skill.slug,
          name: skill.name,
          subCatZhLabel: subCatMeta?.zhLabel ?? '',
          subCatEnLabel: subCatMeta?.enLabel ?? '',
          /** Value string for cmdk filtering ??covers zh + en + sub-category labels. */
          searchValue: `${skill.name} ${subCatMeta?.zhLabel ?? ''} ${subCatMeta?.enLabel ?? ''} ${group.zhLabel} ${group.enLabel}`,
        }));
      });
      return { group, subCategoryEntries };
    }).filter(g => g.subCategoryEntries.length > 0);
  }, [skillOptions, skillBySlug]);

  const handleAddSkillRequirement = () => {
    if (!selectedSkillSlug) return;
    const alreadyAdded = requiredSkills.some(r => r.tagSlug === selectedSkillSlug);
    if (alreadyAdded) {
      toast({ variant: 'destructive', title: 'Skill already added' });
      return;
    }
    const requirement: SkillRequirement = {
      tagSlug: tagSlugRef(selectedSkillSlug),
      minimumTier: 'apprentice',
      quantity: Math.max(1, parseInt(selectedQuantity) || 1),
    };
    setRequiredSkills(prev => [...prev, requirement]);
    setSelectedSkillSlug("");
    setSelectedQuantity("1");
  };

  const handleRemoveSkillRequirement = (slug: string) => {
    setRequiredSkills(prev => prev.filter(r => r.tagSlug !== slug));
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskPickerOpen(false);
    const task = taskOptions.find((option) => option.id === taskId);
    if (!task) return;

    setTitle(task.name);
    setLocation(task.location ?? { description: '' });
    setRequiredSkills(task.requiredSkills ?? []);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }
    setIsAdding(true);
    try {
      await onSubmit({
        taskId: selectedTaskId || undefined,
        title,
        description,
        startDate: dateRange?.from,
        endDate: dateRange?.to,
        location,
        requiredSkills,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Schedule Proposal</DialogTitle>
          <DialogDescription>Submit a new item to the organization&apos;s timeline for approval.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-4">
          {isTaskInheritedMode ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">Task</p>
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">Inherited Location</p>
              <p>{[location?.building, location?.floor, location?.room, location?.description].filter(Boolean).join(' / ') || 'N/A'}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Task (Title)</Label>
                <Popover open={taskPickerOpen} onOpenChange={setTaskPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={taskPickerOpen}
                      className="h-9 w-full justify-between text-xs font-normal"
                    >
                      <span className="truncate">{selectedTaskOption?.name ?? 'Select task...'}</span>
                      <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tasks..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-xs">No task found.</CommandEmpty>
                        <CommandGroup heading="Workspace Tasks">
                          {taskOptions.map((task) => (
                            <CommandItem
                              key={task.id}
                              value={task.name}
                              onSelect={() => handleSelectTask(task.id)}
                              className="text-xs"
                            >
                              {task.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn( "w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground" )}>
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from ? ( dateRange.to ? ( <> {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")} </> ) : ( format(dateRange.from, "LLL dd, y") ) ) : ( <span>Pick a date</span> )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
           {!isTaskInheritedMode && selectedTaskOption && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="size-4" /> Location
              </Label>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                {[location?.building, location?.floor, location?.room, location?.description].filter(Boolean).join(' / ') || 'N/A'}
              </div>
            </div>
           )}
          <div className="space-y-2">
            <Label>Required Skills</Label>
            <p className="text-xs text-muted-foreground">Optional: add or adjust staffing requirements.</p>
            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 py-1">
                {requiredSkills.map(req => {
                  const skillName = skillOptions.find(s => s.slug === req.tagSlug)?.name ?? req.tagSlug;
                  return (
                    <Badge key={req.tagSlug} variant="secondary" className="gap-1 pr-1">
                      {skillName} · ?{req.quantity}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillRequirement(req.tagSlug)}
                        className="ml-1 rounded-full hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Popover open={skillPickerOpen} onOpenChange={setSkillPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={skillPickerOpen}
                      className="h-9 w-full justify-between text-xs font-normal"
                    >
                      <span className="truncate">
                        {selectedSkillSlug
                          ? (skillOptions.find(s => s.slug === selectedSkillSlug)?.name ?? selectedSkillSlug)
                          : 'Select skill...'}
                      </span>
                      <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search skills..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-xs">No skill found.</CommandEmpty>
                        {groupedSkillOptions.map(({ group, subCategoryEntries }) => (
                          <CommandGroup
                            key={group.group}
                            heading={`${group.zhLabel} ??${group.enLabel}`}
                          >
                            {subCategoryEntries.map(skill => (
                              <CommandItem
                                key={skill.slug}
                                value={skill.searchValue}
                                onSelect={() => {
                                  setSelectedSkillSlug(skill.slug);
                                  setSkillPickerOpen(false);
                                }}
                                className="text-xs"
                              >
                                <span className="flex-1">{skill.name}</span>
                                {skill.subCatZhLabel && (
                                  <span className="ml-2 text-[10px] text-muted-foreground">
                                    {skill.subCatZhLabel}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                type="number"
                min={1}
                max={MAX_SKILL_REQUIREMENT_QUANTITY}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
                onBlur={(e) => {
                  const parsed = parseInt(e.target.value);
                  setSelectedQuantity(String(
                    Number.isFinite(parsed) ? Math.min(MAX_SKILL_REQUIREMENT_QUANTITY, Math.max(1, parsed)) : 1
                  ));
                }}
                className="h-9 w-16 text-xs"
              />
              <Button type="button" variant="outline" size="icon" className="size-9" onClick={handleAddSkillRequirement}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isAdding}> {isAdding ? "Adding..." : "Submit Proposal"} </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
