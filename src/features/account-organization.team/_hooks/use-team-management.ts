"use client";

import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import {
  createTeam as createTeamAction,
  updateTeamMembers as updateTeamMembersAction,
} from '../_actions';

export function useTeamManagement() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;

  const organizationId = activeAccount?.accountType === 'organization' ? activeAccount.id : null

  const createTeam = useCallback(async (teamName: string, type: 'internal' | 'external') => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await createTeamAction(organizationId, teamName, type);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  const updateTeamMembers = useCallback(async (teamId: string, memberId: string, action: 'add' | 'remove') => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await updateTeamMembersAction(organizationId, teamId, memberId, action);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  return { createTeam, updateTeamMembers };
}
