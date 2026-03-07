"use client";

/**
 * Module: use-timeline-commands.ts
 * Purpose: Timeline command hook.
 * Responsibilities: handle timeline drag-based rescheduling writes.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useCallback } from 'react';

import { useApp } from '@/app-runtime/providers/app-provider';
import { useAuth } from '@/app-runtime/providers/auth-provider';
import { toast } from '@/shadcn-ui/hooks/use-toast';
import type { ScheduleItem } from '@/shared-kernel';

import { updateTimelineItemDateRange } from '../_actions';

export function useTimelineCommands() {
  const { state: appState } = useApp();
  const { state: authState } = useAuth();
  const { activeAccount } = appState;
  const { user } = authState;

  const rescheduleItem = useCallback(async (item: ScheduleItem, startDate: Date, endDate: Date) => {
    if (!user || !activeAccount) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be signed in to reschedule timeline items.',
      });
      return false;
    }

    const result = await updateTimelineItemDateRange(item.accountId, item.id, startDate, endDate);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Reschedule Failed',
        description: result.error.message,
      });
      return false;
    }

    toast({ title: 'Timeline Updated', description: 'Timeline move has been saved.' });
    return true;
  }, [activeAccount, user]);

  return { rescheduleItem };
}
