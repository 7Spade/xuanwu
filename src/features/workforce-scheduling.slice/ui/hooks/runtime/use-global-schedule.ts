"use client";

import { useMemo } from "react";

import { useApp } from "@/app-runtime/providers/app-provider";
import { useAccount } from "@/features/workspace.slice";

import {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from '../_selectors';

/**
 * @fileoverview useGlobalSchedule - Hook for filtering and preparing schedule data for the account view.
 * @description Delegates data-derivation to pure selector functions in `_selectors.ts`,
 * keeping this hook focused on state subscription and memoisation only.
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

  const organizationMembers = useMemo(() => activeOrganization?.members ?? [], [activeOrganization]);

  const allItems = useMemo(
    () => selectAllScheduleItems(schedule_items ?? {}, workspaces ?? {}),
    [schedule_items, workspaces]
  );

  const pendingProposals = useMemo(() => selectPendingProposals(allItems), [allItems]);

  const decisionHistory = useMemo(() => selectDecisionHistory(allItems), [allItems]);

  const upcomingEvents = useMemo(
    () => selectUpcomingEvents(allItems, organizationMembers),
    [allItems, organizationMembers]
  );

  const presentEvents = useMemo(
    () => selectPresentEvents(allItems, organizationMembers),
    [allItems, organizationMembers]
  );

  return { allItems, pendingProposals, decisionHistory, upcomingEvents, presentEvents, organizationMembers };
}

