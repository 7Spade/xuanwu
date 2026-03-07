// [職責] Business — 單一 Workspace 排程提案與檢視
"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { useWorkspace } from "@/features/workspace.slice";
import { Button } from "@/shadcn-ui/button";

import { useWorkspaceSchedule } from "../_hooks/use-workspace-schedule";

import { UnifiedCalendarGrid } from "./unified-calendar-grid";

export function WorkspaceSchedule() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const {
    localItems,
    organizationMembers,
    currentDate,
    handleMonthChange,
    handleOpenAddDialog,
  } = useWorkspaceSchedule();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-[10px] font-bold uppercase tracking-widest"
          onClick={() => router.push(`/workspaces/${workspace.id}/governance`)}
        >
          <Shield className="size-3.5" /> Governance Panel
        </Button>
      </div>
      <div className="h-[calc(100vh-22rem)]">
        <UnifiedCalendarGrid
          items={localItems}
          members={organizationMembers}
          viewMode="workspace"
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
          onAddClick={handleOpenAddDialog}
        />
      </div>
    </div>
  );
}
