/**
 * @fileoverview AccountScheduleSection - Organization-wide schedule view.
 * @description Aggregated view of all proposed and official schedule items across all
 * workspaces. Includes an org-only guard and uses the `useScheduleActions` hook for
 * all write operations (approve/reject/assign).
 *
 * Tabs:
 *   - 排程日曆 (Calendar): unified calendar grid + upcoming/present/history tables
 *   - 人力管理 (Workforce): skill-aware proposal assignment + lifecycle (OrgScheduleGovernance)
 *
 * Merge rationale:
 *   - DemandBoard (old Tab 2) removed: OrgScheduleGovernance covers the same lifecycle
 *     (PROPOSAL → assign + approve → OFFICIAL → complete) with superior skill-tier matching.
 *   - GovernanceSidebar removed from Calendar tab: having approve/reject in two places
 *     (sidebar + HR tab) fragmented the workflow. Calendar is now a clean read-only view.
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, UserPlus, Calendar, ListChecks, History, Users } from "lucide-react";
import { toast } from "@/shared/utility-hooks/use-toast";
import type { ScheduleItem } from "@/shared/types";
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
import { ScheduleDataTable } from "./schedule-data-table";
import { useGlobalSchedule } from "../_hooks/use-global-schedule";
import { decisionHistoryColumns } from "./decision-history-columns";
import { upcomingEventsColumns } from "./upcoming-events-columns";
import { addMonths, subMonths } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu";
import { Button } from "@/shared/shadcn-ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import { useScheduleActions } from "../_hooks/use-schedule-commands";
import { useApp } from "@/shared/app-providers/app-context";
import { OrgScheduleGovernance } from "./org-schedule-governance";

export function AccountScheduleSection() {
  const { state } = useApp();
  const { activeAccount } = state;
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { allItems, decisionHistory, upcomingEvents, presentEvents, organizationMembers } = useGlobalSchedule();
  const { assignMember, unassignMember, approveItem, rejectItem } = useScheduleActions();

  const handleAction = useCallback(async (item: ScheduleItem, newStatus: 'OFFICIAL' | 'REJECTED') => {
    try {
      if (newStatus === 'OFFICIAL') {
        await approveItem(item);
      } else {
        await rejectItem(item);
      }
      const successTitle = newStatus === 'OFFICIAL' ? "提案已核准" : "提案已拒絕";
      toast({ title: successTitle, description: `「${item.title}」已更新。` });
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "操作失敗", description: e instanceof Error ? e.message : "發生未知錯誤。" });
    }
  }, [approveItem, rejectItem]);

  const approveProposal = (item: ScheduleItem) => handleAction(item, 'OFFICIAL');
  const rejectProposal = (item: ScheduleItem) => handleAction(item, 'REJECTED');

  const onItemClick = (item: ScheduleItem) => {
    router.push(`/workspaces/${item.workspaceId}?capability=schedule`);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  };

  const renderItemActions = useCallback((item: ScheduleItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-primary">
          <UserPlus className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Assign Member</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizationMembers.map(member => (
          <DropdownMenuCheckboxItem
            key={member.id}
            checked={item.assigneeIds.includes(member.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => {
              if (item.assigneeIds.includes(member.id)) {
                unassignMember(item, member.id);
              } else {
                assignMember(item, member.id);
              }
            }}
          >
            {member.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ), [organizationMembers, assignMember, unassignMember]);

  if (activeAccount?.accountType !== "organization") {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertCircle className="size-10 text-muted-foreground" />
        <h3 className="font-bold">Schedule Not Available</h3>
        <p className="text-sm text-muted-foreground">
          The organization-wide schedule is only available within an organization dimension.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-full flex-col duration-700 animate-in fade-in">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="font-headline text-4xl font-bold tracking-tight">Organization Schedule</h1>
          <p className="text-muted-foreground">
            Aggregated view of all proposed and official schedule items across all workspaces.
          </p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="flex h-full flex-col">
        <TabsList className="mb-6 w-full justify-start">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="size-4" />
            排程日曆
          </TabsTrigger>
          <TabsTrigger value="hr-management" className="gap-2">
            <Users className="size-4" />
            人力管理
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Calendar — full-width grid + upcoming/present/history tables */}
        <TabsContent value="calendar" className="flex flex-1 flex-col gap-8">
          <div className="min-h-[60vh] overflow-hidden rounded-xl border bg-card">
            <UnifiedCalendarGrid
              items={allItems}
              members={organizationMembers}
              viewMode="organization"
              currentDate={currentDate}
              onMonthChange={handleMonthChange}
              onItemClick={onItemClick}
              onApproveProposal={approveProposal}
              onRejectProposal={rejectProposal}
              renderItemActions={renderItemActions}
            />
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <Calendar className="size-4" />
                Future Events
              </h3>
              <ScheduleDataTable columns={upcomingEventsColumns} data={upcomingEvents} />
            </div>
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <ListChecks className="size-4" />
                Present Events
              </h3>
              <ScheduleDataTable columns={upcomingEventsColumns} data={presentEvents} />
            </div>
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <History className="size-4" />
                Decision History (Last 7 Days)
              </h3>
              <ScheduleDataTable columns={decisionHistoryColumns} data={decisionHistory} />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: 人力管理 — unified workforce management
            Covers: PROPOSAL (skill-aware assign + approve/cancel) + OFFICIAL (mark complete).
            Supersedes the old DemandBoard tab (simple assign) and the GovernanceSidebar
            (approve-only, no assignment) that previously lived in the Calendar tab. */}
        <TabsContent value="hr-management">
          <OrgScheduleGovernance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
