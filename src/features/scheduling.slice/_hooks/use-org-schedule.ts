'use client';

/**
 * account-organization.schedule — _hooks/use-org-schedule.ts
 *
 * React hook for subscribing to org schedule items.
 * Used by the org governance UI to display and act on pending proposals.
 *
 * Per logic-overview.md:
 *   ORGANIZATION_SCHEDULE → (org governance reads pending proposals via this hook)
 *
 * Single source of truth: accounts/{orgId}/schedule_items
 */

import { useState, useEffect } from 'react';
import { subscribeToOrgScheduleProposals, subscribeToPendingProposals, subscribeToConfirmedProposals } from '../_queries';
import type { ScheduleItem, ScheduleStatus } from '@/shared/types';

/**
 * Subscribes to all org schedule items for the given orgId.
 * Optionally filter to a specific status.
 */
export function useOrgSchedule(
  orgId: string | null,
  opts?: { status?: ScheduleStatus }
) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const status = opts?.status;

  useEffect(() => {
    if (!orgId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToOrgScheduleProposals(orgId, (updated) => {
      setItems(updated);
      setLoading(false);
    }, status ? { status } : undefined);

    return unsub;
  }, [orgId, status]);

  return { items, loading };
}

/**
 * Convenience hook that only returns pending proposals (status = 'PROPOSAL').
 * Used by the approval workflow in the org governance UI.
 */
export function usePendingScheduleProposals(orgId: string | null) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToPendingProposals(orgId, (updated) => {
      setItems(updated);
      setLoading(false);
    });

    return unsub;
  }, [orgId]);

  return { items, loading };
}

/**
 * Convenience hook that returns confirmed items only (status = 'OFFICIAL').
 * Used by the FR-S6 "Complete Schedule" governance UI.
 */
export function useConfirmedScheduleProposals(orgId: string | null) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToConfirmedProposals(orgId, (updated) => {
      setItems(updated);
      setLoading(false);
    });

    return unsub;
  }, [orgId]);

  return { items, loading };
}
