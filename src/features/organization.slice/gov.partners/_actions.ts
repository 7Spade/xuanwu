'use server';

/**
 * account-organization.partner ??_actions.ts
 *
 * Server actions for organization partner management.
 *
 * Per 00-LogicOverview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */

import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/shared-kernel";
import type { MemberReference } from "@/shared-kernel";
import {
  createTeam as createTeamFacade,
  sendPartnerInvite as sendPartnerInviteFacade,
  dismissPartnerMember as dismissPartnerMemberFacade,
} from "@/shared-infra/frontend-firebase/firestore/firestore.facade";

export async function createPartnerGroup(
  organizationId: string,
  groupName: string
): Promise<CommandResult> {
  try {
    await createTeamFacade(organizationId, groupName, "external");
    return commandSuccess(organizationId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "CREATE_PARTNER_GROUP_FAILED",
      err instanceof Error ? err.message : "Failed to create partner group"
    );
  }
}

export async function sendPartnerInvite(
  organizationId: string,
  teamId: string,
  email: string
): Promise<CommandResult> {
  try {
    await sendPartnerInviteFacade(organizationId, teamId, email);
    return commandSuccess(teamId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "SEND_PARTNER_INVITE_FAILED",
      err instanceof Error ? err.message : "Failed to send partner invite"
    );
  }
}

export async function dismissPartnerMember(
  organizationId: string,
  teamId: string,
  member: MemberReference
): Promise<CommandResult> {
  try {
    await dismissPartnerMemberFacade(organizationId, teamId, member);
    return commandSuccess(member.id, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "DISMISS_PARTNER_MEMBER_FAILED",
      err instanceof Error ? err.message : "Failed to dismiss partner member"
    );
  }
}
