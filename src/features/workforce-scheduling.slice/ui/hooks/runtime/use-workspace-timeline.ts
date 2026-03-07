"use client";

/**
 * Module: use-workspace-timeline.ts
 * Purpose: Workspace-level timeline state hook.
 * Responsibilities: subscribe workspace timeline items and resolve member references.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useEffect, useMemo, useState } from 'react';

import { useApp } from '@/app-runtime/providers/app-provider';
import { useWorkspace } from '@/features/workspace.slice';
import type { ScheduleItem } from '@/shared-kernel';
import type { WorkspaceTask } from '@/features/workspace.slice';

import { subscribeToWorkspaceTimelineItems } from '../../../application/queries/timeline.queries';
import type { TimelineMember } from '../../types/timeline.types';

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

  const draggableTasks = useMemo<WorkspaceTask[]>(() => {
    const scheduledTaskIds = new Set(
      items
        .map((item) => item.originTaskId)
        .filter((taskId): taskId is string => typeof taskId === 'string' && taskId.length > 0)
    );

    return Object.values(workspace.tasks ?? {})
      .filter((task) => !scheduledTaskIds.has(task.id))
      .filter((task) => !['completed', 'verified', 'accepted'].includes(task.progressState));
  }, [items, workspace.tasks]);

  return {
    workspace,
    items,
    organizationMembers,
    draggableTasks,
  };
}
