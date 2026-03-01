'use server';

/**
 * account-organization.core — _actions.ts
 *
 * Server actions for core organization lifecycle management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */

import {
  createOrganization as createOrganizationFacade,
  updateOrganizationSettings as updateOrganizationSettingsFacade,
  deleteOrganization as deleteOrganizationFacade,
  createTeam as createTeamFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { Account, ThemeConfig } from "@/shared/types";
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";

export async function createOrganization(
  organizationName: string,
  owner: Account
): Promise<CommandResult> {
  try {
    const orgId = await createOrganizationFacade(organizationName, owner);
    return commandSuccess(orgId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "CREATE_ORGANIZATION_FAILED",
      err instanceof Error ? err.message : "Failed to create organization"
    );
  }
}

export async function updateOrganizationSettings(
  organizationId: string,
  settings: { name?: string; description?: string; theme?: ThemeConfig | null }
): Promise<CommandResult> {
  try {
    await updateOrganizationSettingsFacade(organizationId, settings);
    return commandSuccess(organizationId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "UPDATE_ORGANIZATION_SETTINGS_FAILED",
      err instanceof Error ? err.message : "Failed to update organization settings"
    );
  }
}

export async function deleteOrganization(organizationId: string): Promise<CommandResult> {
  try {
    await deleteOrganizationFacade(organizationId);
    return commandSuccess(organizationId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "DELETE_ORGANIZATION_FAILED",
      err instanceof Error ? err.message : "Failed to delete organization"
    );
  }
}

export async function setupOrganizationWithTeam(
  organizationName: string,
  owner: Account,
  teamName: string,
  teamType: "internal" | "external" = "internal"
): Promise<CommandResult> {
  try {
    const organizationId = await createOrganizationFacade(organizationName, owner);
    await createTeamFacade(organizationId, teamName, teamType);
    return commandSuccess(organizationId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "SETUP_ORGANIZATION_WITH_TEAM_FAILED",
      err instanceof Error ? err.message : "Failed to setup organization with team"
    );
  }
}
