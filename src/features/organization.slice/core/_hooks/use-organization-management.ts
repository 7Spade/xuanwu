"use client";

import { useCallback } from 'react';

import { useApp } from '@/app-runtime/providers/app-provider';
import { useAuth } from '@/app-runtime/providers/auth-provider';
import type { ThemeConfig } from '@/shared-kernel';

import {
  createOrganization as createOrganizationAction,
  updateOrganizationSettings as updateOrganizationSettingsAction,
  deleteOrganization as deleteOrganizationAction,
  uploadOrganizationAvatar as uploadOrganizationAvatarAction,
} from '../_actions';

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

  const updateOrganizationSettings = useCallback(async (settings: { name?: string; description?: string; theme?: ThemeConfig | null; photoURL?: string; }) => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await updateOrganizationSettingsAction(organizationId, settings);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!organizationId) throw new Error('No active organization selected');
    const photoURL = await uploadOrganizationAvatarAction(organizationId, file);
    await updateOrganizationSettings({ photoURL });
    return photoURL;
  }, [organizationId, updateOrganizationSettings]);

  const deleteOrganization = useCallback(async () => {
    if (!organizationId) throw new Error('No active organization selected');
    const result = await deleteOrganizationAction(organizationId);
    if (!result.success) throw new Error(result.error.message);
  }, [organizationId]);

  return {
    createOrganization,
    updateOrganizationSettings,
    deleteOrganization,
    uploadAvatar,
  };
}
