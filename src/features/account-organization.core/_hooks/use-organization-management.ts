"use client";

import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import { useAuth } from '@/shared/app-providers/auth-provider';
import {
  createOrganization as createOrganizationAction,
  updateOrganizationSettings as updateOrganizationSettingsAction,
  deleteOrganization as deleteOrganizationAction,
} from '../_actions';
import type { ThemeConfig } from '@/shared/types';

export function useOrganizationManagement() {
  const { state: appState } = useApp();
  const { activeAccount } = appState;
  const { state: authState } = useAuth();
  const { user } = authState;

  const organizationId = activeAccount?.accountType === 'organization' ? activeAccount.id : null

  const createOrganization = useCallback(async (organizationName: string): Promise<string> => {
    if (!user) throw new Error("User must be authenticated to create an organization.");
    const result = await createOrganizationAction(organizationName, user);
    if (!result.success) throw new Error(result.error.message);
    return result.aggregateId;
  }, [user]);

  const updateOrganizationSettings = useCallback(async (settings: { name?: string; description?: string; theme?: ThemeConfig | null; }) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await updateOrganizationSettingsAction(organizationId, settings);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  const deleteOrganization = useCallback(async () => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await deleteOrganizationAction(organizationId);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  return {
    createOrganization,
    updateOrganizationSettings,
    deleteOrganization,
  };
}
