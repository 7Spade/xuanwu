"use client";

/**
 * Module: use-workspace-timeline.ts
 * Purpose: Workspace-level timeline state hook.
 * Responsibilities: subscribe workspace timeline items and resolve member references.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useEffect, useMemo, useState } from 'react';

import type { ScheduleItem } from '@/shared-kernel';
import { useWorkspace } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';

import { subscribeToWorkspaceTimelineItems } from '../_queries';
import type { TimelineMember } from '../_types';

export function useWorkspaceTimeline() {
  const { workspace } = useWorkspace();
  const { state: appState } = useApp();
  const { accounts } = appState;
  const [items, setItems] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (!workspace.dimensionId || !workspace.id) {
      setItems([]);
      return;
    }

    return subscribeToWorkspaceTimelineItems(
      workspace.dimensionId,
      workspace.id,
      setItems,
      (error) => console.error('[useWorkspaceTimeline] timeline subscription failed:', error)
    );
  }, [workspace.dimensionId, workspace.id]);

  const organizationMembers = useMemo<TimelineMember[]>(() => {
    const account = accounts[workspace.dimensionId];
    return (account?.members ?? []).map((member) => ({
      id: String(member.id),
      name: member.name ? String(member.name) : String(member.id),
    }));
  }, [accounts, workspace.dimensionId]);

  return {
    workspace,
    items,
    organizationMembers,
  };
}
