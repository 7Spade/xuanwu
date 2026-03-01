"use client";

import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import {
  recruitMember as recruitMemberAction,
  dismissMember as dismissMemberAction,
} from '../_actions';
import type { MemberReference } from '@/shared/types';

export function useMemberManagement() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;

  const organizationId = activeAccount?.accountType === 'organization' ? activeAccount.id : null

  const recruitMember = useCallback(async (newId: string, name: string, email: string) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await recruitMemberAction(organizationId, newId, name, email);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  const dismissMember = useCallback(async (member: MemberReference) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await dismissMemberAction(organizationId, member);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  return { recruitMember, dismissMember };
}
