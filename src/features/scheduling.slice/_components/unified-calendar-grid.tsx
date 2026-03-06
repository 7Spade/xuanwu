/**
 * Module: unified-calendar-grid.tsx
 * Purpose: Render calendar UI for schedule items.
 * Responsibilities: presentation of month grid, day cells, and item cards
 * Constraints: deterministic logic, respect module boundaries
 */

"use client";

import { format, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { Plus, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import type { ScheduleItem } from "@/shared-kernel";
import { type MemberReference } from "@/shared-kernel";
import { findSkill } from "@/shared/constants/skills";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip";
import { cn } from "@/shared/shadcn-ui/utils/utils";

import {
  buildCardsByDate,
  buildSpanSegmentsByDate,
  sortSegments,
  toCalendarDate,
} from "./unified-calendar-grid.utils";


const DAYS_OF_WEEK = ["日", "一", "二", "三", "四", "五", "六"];

interface UnifiedCalendarGridProps {
  items: ScheduleItem[];
  members: MemberReference[];
  viewMode: 'workspace' | 'organization';
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onItemClick?: (item: ScheduleItem) => void;
  onAddClick?: (date: Date) => void;
  onApproveProposal?: (item: ScheduleItem) => void;
  onRejectProposal?: (item: ScheduleItem) => void;
  renderItemActions?: (item: ScheduleItem) => React.ReactNode;
}

/**
 * @fileoverview UnifiedCalendarGrid - A dumb component for rendering schedule items.
 * @description REFACTORED: This component is now a pure presentation component.
 * It receives all data and callbacks via props and is responsible only for rendering
 * the calendar grid. All state management and dialogs have been moved to parent components.
 */
export function UnifiedCalendarGrid({
  items,
  members,
  viewMode,
  currentDate,
  onMonthChange,
  onItemClick: _onItemClick,
  onAddClick,
  onApproveProposal,
  onRejectProposal,
  renderItemActions,
}: UnifiedCalendarGridProps) {
  
  const router = useRouter();

  const membersMap = useMemo(() => 
    new Map<string, MemberReference>(members.map(m => [m.id, m])), 
    [members]
  );

  const cardsByDate = useMemo(() => {
    return buildCardsByDate(items);
  }, [items]);

  const spanSegmentsByDate = useMemo(() => {
    return buildSpanSegmentsByDate(items);
  }, [items]);

  const firstDay = startOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: endOfMonth(firstDay) });
  const startingDayIndex = getDay(firstDay);
  const totalCells = Math.ceil((startingDayIndex + daysInMonth.length) / 7) * 7;
  
  return (
     <div className="flex h-full flex-col">
      <div className="flex items-center justify-center gap-4 border-b p-4">
        <Button variant="outline" size="icon" className="size-8" onClick={() => onMonthChange('prev')}>
            <ChevronLeft className="size-4" />
        </Button>
        <h2 className="w-48 text-center text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" className="size-8" onClick={() => onMonthChange('next')}>
            <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-7">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="border-b border-r bg-muted/50 p-2 text-center text-xs font-bold text-muted-foreground">{day}</div>
        ))}
        
        {Array.from({ length: startingDayIndex }).map((_, i) => (
          <div key={`pad-start-${i}`} className="border-b border-r bg-muted/30" />
        ))}
        
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = cardsByDate.get(dateKey) || [];
          const daySegments = sortSegments(spanSegmentsByDate.get(dateKey) || []);
          
          return (
            <div key={dateKey} className={cn('group relative flex min-h-[140px] flex-col gap-1.5 border-r border-b p-1.5', { 'bg-muted/30': isWeekend(day) })}>
              {viewMode === 'workspace' && onAddClick && (
                <Button variant="ghost" size="icon" className="absolute left-1 top-1 size-6 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => onAddClick(day)}>
                  <Plus className="size-4 text-muted-foreground" />
                </Button>
              )}
              <div className="flex justify-end">
                <div className={cn( 'flex h-6 w-6 items-center justify-center rounded-full text-sm', isToday(day) && 'bg-primary font-bold text-primary-foreground' )}>
                  {format(day, 'd')}
                </div>
              </div>
              <ScrollArea className="grow pr-2">
                <div className="space-y-2">
                  {daySegments.length > 0 && (
                    <div className="space-y-1">
                      {daySegments.map((segment) => {
                        const segmentStart = toCalendarDate(segment.item.startDate) || day;
                        const segmentEnd = toCalendarDate(segment.item.endDate) || segmentStart;

                        return (
                          <div
                            key={`${segment.item.id}-${dateKey}`}
                            className={cn(
                              'h-1.5 w-full bg-primary/60',
                              segment.isStart && 'rounded-l-full',
                              segment.isEnd && 'rounded-r-full',
                              segment.isStart && segment.isEnd && 'rounded-full'
                            )}
                            title={`${segment.item.title} (${format(segmentStart, 'MM/dd')} - ${format(segmentEnd, 'MM/dd')})`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {dayItems.map(item => {
                    const assignedMembers = item.assigneeIds.map(id => membersMap.get(id)).filter(Boolean) as MemberReference[];

                    return (
                        <div key={item.id} className="space-y-1">
                            <div 
                                className={cn(
                                    "rounded-lg border text-xs", 
                                    item.status === 'PROPOSAL' ? 'border-dashed border-primary/50 bg-primary/5' : 'bg-background shadow-sm'
                                )}
                            >
                            {/* Section 1: Title — workspace name prepended in org view */}
                            <div className="rounded-t-md p-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className="w-full cursor-pointer text-left"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (viewMode === 'organization') {
                                                        router.push(`/workspaces/${item.workspaceId}?capability=schedule`);
                                                    }
                                                }}
                                            >
                                                {viewMode === 'organization' && item.workspaceName ? (
                                                    <p className="truncate font-bold">
                                                        <span className="text-muted-foreground">{item.workspaceName}</span>
                                                        <span className="mx-0.5 text-muted-foreground">-</span>
                                                        {item.title}
                                                    </p>
                                                ) : (
                                                    <p className="truncate font-bold">{item.title}</p>
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {viewMode === 'organization' && item.workspaceName
                                                    ? `${item.workspaceName} - ${item.title}`
                                                    : item.title}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Section 2: Skills (one per row) + assignees + gap actions */}
                            <div className="flex items-start justify-between gap-0.5 border-t px-2 py-1.5">
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                  {item.requiredSkills && item.requiredSkills.length > 0 ? (
                                    item.requiredSkills.map((req) => (
                                      <div key={req.tagSlug} className="flex items-center gap-1">
                                        <Badge variant="secondary" className="h-4 px-1 text-[8px] font-medium leading-none">
                                          {findSkill(req.tagSlug)?.name ?? req.tagSlug}
                                          {req.quantity > 1 && ` ×${req.quantity}`}
                                        </Badge>
                                        {/* One assign button per skill requirement row */}
                                        {item.status === 'PROPOSAL' && renderItemActions && renderItemActions(item)}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center -space-x-1">
                                      {assignedMembers.map(m => (
                                        <TooltipProvider key={m.id}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Avatar className="size-5 border border-background">
                                                <AvatarFallback className="text-[8px] font-bold">{m.name[0]}</AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{m.name}</p></TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ))}
                                      {/* Assign button when there are no skill requirements */}
                                      {item.status === 'PROPOSAL' && renderItemActions && renderItemActions(item)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-0.5">
                                  {item.requiredSkills && item.requiredSkills.length > 0 && (
                                    <div className="flex -space-x-1">
                                      {assignedMembers.map(m => (
                                        <TooltipProvider key={m.id}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Avatar className="size-5 border border-background">
                                                <AvatarFallback className="text-[8px] font-bold">{m.name[0]}</AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{m.name}</p></TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ))}
                                    </div>
                                  )}
                                  {viewMode === 'organization' && item.status === 'PROPOSAL' && onApproveProposal && onRejectProposal && (
                                    <div className="flex gap-0.5">
                                        <Button size="icon" variant="ghost" className="size-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); onRejectProposal(item); }}>
                                            <X className="size-3"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" className="size-6 p-0 text-green-600" onClick={(e) => { e.stopPropagation(); onApproveProposal(item); }}>
                                            <Check className="size-3"/>
                                        </Button>
                                    </div>
                                  )}
                                </div>
                            </div>
                            </div>
                        </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )
        })}
        
        {Array.from({ length: totalCells > (startingDayIndex + daysInMonth.length) ? totalCells - (startingDayIndex + daysInMonth.length) : 0 }).map((_, i) => (
          <div key={`pad-end-${i}`} className="border-b border-r bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
