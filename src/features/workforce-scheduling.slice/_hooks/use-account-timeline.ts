"use client";

/**
 * Module: use-account-timeline.ts
 * Purpose: Account-level timeline state hook.
 * Responsibilities: provide organization timeline items and member references.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useMemo } from 'react';

import type { ScheduleItem } from '@/shared-kernel';
import { useAccount } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';

import type { TimelineMember } from '../_types';

export function useAccountTimeline() {
  const { state: appState } = useApp();
  const { state: accountState } = useAccount();
  const { activeAccount, accounts } = appState;

  const isOrganizationAccount = activeAccount?.accountType === 'organization';
  const organizationId = isOrganizationAccount ? activeAccount.id : null;

  const items = useMemo<ScheduleItem[]>(() => {
    if (!isOrganizationAccount) return [];
    return Object.values(accountState.schedule_items ?? {});
  }, [accountState.schedule_items, isOrganizationAccount]);

  const organizationMembers = useMemo<TimelineMember[]>(() => {
    if (!organizationId) return [];
    const org = accounts[organizationId];
    return (org?.members ?? []).map((member) => ({
      id: String(member.id),
      name: member.name ? String(member.name) : String(member.id),
    }));
  }, [accounts, organizationId]);

  return {
    isOrganizationAccount,
    organizationId,
    items,
    organizationMembers,
  };
}
