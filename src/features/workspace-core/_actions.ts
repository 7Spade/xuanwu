'use server';

/**
 * @fileoverview workspace.commands.ts - Pure business logic for workspace write operations.
 * @description Contains framework-agnostic action functions for managing workspaces,
 * including team authorization, member access grants, capabilities, settings, and
 * lifecycle. These functions can be called from React hooks, context, or Server Actions
 * without any React dependencies.
 */

import {
  createWorkspace as createWorkspaceFacade,
  authorizeWorkspaceTeam as authorizeWorkspaceTeamFacade,
  revokeWorkspaceTeam as revokeWorkspaceTeamFacade,
  grantIndividualWorkspaceAccess as grantIndividualWorkspaceAccessFacade,
  revokeIndividualWorkspaceAccess as revokeIndividualWorkspaceAccessFacade,
  mountCapabilities as mountCapabilitiesFacade,
  unmountCapability as unmountCapabilityFacade,
  updateWorkspaceSettings as updateWorkspaceSettingsFacade,
  deleteWorkspace as deleteWorkspaceFacade,
} from "@/shared/infra/firestore/firestore.facade"
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';
import type { Account, Capability, WorkspaceRole, WorkspaceLifecycleState } from "@/shared/types"

export async function createWorkspace(
  name: string,
  account: Account
): Promise<CommandResult> {
  try {
    const workspaceId = await createWorkspaceFacade(name, account);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_CREATE_FAILED', message);
  }
}

export async function authorizeWorkspaceTeam(
  workspaceId: string,
  teamId: string
): Promise<CommandResult> {
  try {
    await authorizeWorkspaceTeamFacade(workspaceId, teamId);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_TEAM_AUTHORIZE_FAILED', message);
  }
}

export async function revokeWorkspaceTeam(
  workspaceId: string,
  teamId: string
): Promise<CommandResult> {
  try {
    await revokeWorkspaceTeamFacade(workspaceId, teamId);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_TEAM_REVOKE_FAILED', message);
  }
}

export async function grantIndividualWorkspaceAccess(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  protocol?: string
): Promise<CommandResult> {
  try {
    await grantIndividualWorkspaceAccessFacade(workspaceId, userId, role, protocol);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_ACCESS_GRANT_FAILED', message);
  }
}

export async function revokeIndividualWorkspaceAccess(
  workspaceId: string,
  grantId: string
): Promise<CommandResult> {
  try {
    await revokeIndividualWorkspaceAccessFacade(workspaceId, grantId);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_ACCESS_REVOKE_FAILED', message);
  }
}

export async function mountCapabilities(
  workspaceId: string,
  capabilities: Capability[]
): Promise<CommandResult> {
  try {
    await mountCapabilitiesFacade(workspaceId, capabilities);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_CAPABILITIES_MOUNT_FAILED', message);
  }
}

export async function unmountCapability(
  workspaceId: string,
  capability: Capability
): Promise<CommandResult> {
  try {
    await unmountCapabilityFacade(workspaceId, capability);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_CAPABILITY_UNMOUNT_FAILED', message);
  }
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
  }
): Promise<CommandResult> {
  try {
    await updateWorkspaceSettingsFacade(workspaceId, settings);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_SETTINGS_UPDATE_FAILED', message);
  }
}

export async function deleteWorkspace(workspaceId: string): Promise<CommandResult> {
  try {
    await deleteWorkspaceFacade(workspaceId);
    return commandSuccess(workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_DELETE_FAILED', message);
  }
}
