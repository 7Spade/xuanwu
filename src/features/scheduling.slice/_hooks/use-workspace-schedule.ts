// [職責] Business — 單一 Workspace 排程提案與狀態邏輯
/**
 * @fileoverview useWorkspaceSchedule - Hook for workspace-scoped schedule state and actions.
 * @description Encapsulates data derivation, state management, side effects, and
 * write actions for the workspace schedule feature. Keeps the view component as a thin renderer.
 *
 * @responsibility
 * - Subscribe directly to accounts/{dimensionId}/schedule_items for this workspace so that
 *   proposals submitted by workspace members (whose activeAccount may be personal, not org)
 *   are always visible in the workspace calendar.
 * - Derive `organizationMembers` from AppContext active account.
 * - Handle `scheduleTaskRequest` cross-capability hint effect.
 * - Manage calendar navigation state: `currentDate`.
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useWorkspace } from "@/features/workspace-core";
import { useApp } from "@/shared/app-providers/app-context";
import { useFirebase } from "@/shared/app-providers/firebase-provider";
import { useRouter } from "next/navigation";
import { toast } from "@/shared/utility-hooks/use-toast";
import { addMonths, subMonths, format } from "date-fns";
import type { ScheduleItem } from "@/shared/types";

export function useWorkspaceSchedule() {
  const { workspace } = useWorkspace();
  const { state: appState, dispatch: appDispatch } = useApp();
  const { accounts, activeAccount, scheduleTaskRequest } = appState;
  const { db } = useFirebase();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [localItems, setLocalItems] = useState<ScheduleItem[]>([]);

  // Cross-capability hint: when a task triggers a schedule request, surface a toast.
  useEffect(() => {
    if (scheduleTaskRequest && scheduleTaskRequest.workspaceId === workspace.id) {
      toast({
        title: "Schedule Request Hint",
        description: `A new task "${scheduleTaskRequest.taskName}" is ready. You can now add it to the schedule.`,
      });
      appDispatch({ type: "CLEAR_SCHEDULE_TASK_REQUEST" });
    }
  }, [scheduleTaskRequest, workspace.id, appDispatch]);

  // Subscribe directly to the org's schedule_items for this workspace.
  // AccountProvider only subscribes when activeAccount.accountType === 'organization'.
  // Workspace members on a personal account would therefore see an empty calendar
  // even after submitting a proposal. This direct subscription fixes that gap.
  useEffect(() => {
    if (!db || !workspace.dimensionId) return;
    const q = query(
      collection(db, "accounts", workspace.dimensionId, "schedule_items"),
      where("workspaceId", "==", workspace.id),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(
      q,
      (snap) => {
        setLocalItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleItem)));
      },
      (err) => {
        console.error("[useWorkspaceSchedule] schedule_items subscription failed:", err);
      }
    );
  }, [db, workspace.dimensionId, workspace.id]);

  const activeOrganization = useMemo(() =>
    activeAccount?.accountType === "organization" ? accounts[activeAccount.id] : null,
    [accounts, activeAccount]
  );

  const organizationMembers = useMemo(() => activeOrganization?.members || [], [activeOrganization]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentDate(current => direction === "prev" ? subMonths(current, 1) : addMonths(current, 1));
  };

  const handleOpenAddDialog = (date: Date) => {
    router.push(`schedule-proposal?date=${format(date, "yyyy-MM-dd")}`);
  };

  return {
    localItems,
    organizationMembers,
    currentDate,
    handleMonthChange,
    handleOpenAddDialog,
  };
}

