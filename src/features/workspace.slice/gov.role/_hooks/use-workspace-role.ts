'use client';

/**
 * workspace-governance.role — _hooks/use-workspace-role.ts
 *
 * React hook for reading the current user's workspace role.
 */

import { useState, useEffect } from 'react';

import type { WorkspaceGrant } from '../_types';

import { getWorkspaceGrant } from '../_queries';

export function useWorkspaceRole(workspaceId: string | null, userId: string | null) {
  const [grant, setGrant] = useState<WorkspaceGrant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !userId) {
      setGrant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getWorkspaceGrant(workspaceId, userId)
      .then((g) => {
        setGrant(g);
        setLoading(false);
      })
      .catch(() => {
        setGrant(null);
        setLoading(false);
      });
  }, [workspaceId, userId]);

  return { grant, role: grant?.role ?? null, loading };
}
