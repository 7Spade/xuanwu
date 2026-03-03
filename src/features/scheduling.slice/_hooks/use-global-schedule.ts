"use client";

import { useMemo } from "react";

import { useAccount } from "@/features/workspace.slice";
import { useApp } from "@/shared/app-providers/app-context";

import {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from "../_selectors";

/**
 * @fileoverview useGlobalSchedule - Hook for filtering and preparing schedule data for the account view.
 * @description Encapsulates all data manipulation logic for the organization-level
 * schedule, keeping the main component clean and focused on rendering.
 */
export function useGlobalSchedule() {
  const { state: appState } = useApp();
  const { state: accountState } = useAccount();
  const { workspaces, schedule_items } = accountState;
  const { accounts, activeAccount } = appState;

  const activeOrganization = useMemo(() =>
    activeAccount?.accountType === 'organization' ? accounts[activeAccount.id] : null,
    [accounts, activeAccount]
  );

  const organizationMembers = useMemo(() => activeOrganization?.members || [], [activeOrganization]);

  const allItems = useMemo(() => {
    return selectAllScheduleItems(schedule_items, workspaces);
  }, [schedule_items, workspaces]);

  const pendingProposals = useMemo(() => {
    return selectPendingProposals(allItems);
  }, [allItems]);

  const decisionHistory = useMemo(() => {
    return selectDecisionHistory(allItems);
  }, [allItems]);

  const upcomingEvents = useMemo(() => {
    return selectUpcomingEvents(allItems, organizationMembers);
  }, [allItems, organizationMembers]);

  const presentEvents = useMemo(() => {
    return selectPresentEvents(allItems, organizationMembers);
  }, [allItems, organizationMembers]);

  return { allItems, pendingProposals, decisionHistory, upcomingEvents, presentEvents, organizationMembers };
}
