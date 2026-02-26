"use client";

import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import {
  createPartnerGroup as createPartnerGroupAction,
  sendPartnerInvite as sendPartnerInviteAction,
  dismissPartnerMember as dismissPartnerMemberAction,
} from '../_actions';
import type { MemberReference } from '@/shared/types';

export function usePartnerManagement() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;

  const organizationId = activeAccount?.accountType === 'organization' ? activeAccount.id : null

  const createPartnerGroup = useCallback(async (groupName: string) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await createPartnerGroupAction(organizationId, groupName);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  const sendPartnerInvite = useCallback(async (teamId: string, email: string) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await sendPartnerInviteAction(organizationId, teamId, email);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  const dismissPartnerMember = useCallback(async (teamId: string, member: MemberReference) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await dismissPartnerMemberAction(organizationId, teamId, member);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  return { createPartnerGroup, sendPartnerInvite, dismissPartnerMember };
}
