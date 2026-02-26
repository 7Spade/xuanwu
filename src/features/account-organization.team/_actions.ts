'use server';

/**
 * account-organization.team — _actions.ts
 *
 * Server actions for organization team management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */

import {
  createTeam as createTeamFacade,
  updateTeamMembers as updateTeamMembersFacade,
} from "@/shared/infra/firestore/firestore.facade";
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared.kernel.contract-interfaces";

export async function createTeam(
  organizationId: string,
  teamName: string,
  type: "internal" | "external"
): Promise<CommandResult> {
  try {
    await createTeamFacade(organizationId, teamName, type);
    return commandSuccess(organizationId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "CREATE_TEAM_FAILED",
      err instanceof Error ? err.message : "Failed to create team"
    );
  }
}

export async function updateTeamMembers(
  organizationId: string,
  teamId: string,
  memberId: string,
  action: "add" | "remove"
): Promise<CommandResult> {
  try {
    await updateTeamMembersFacade(organizationId, teamId, memberId, action);
    return commandSuccess(teamId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "UPDATE_TEAM_MEMBERS_FAILED",
      err instanceof Error ? err.message : "Failed to update team members"
    );
  }
}
