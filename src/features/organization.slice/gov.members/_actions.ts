'use server';

/**
 * account-organization.member — _actions.ts
 *
 * Server actions for organization member management.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 *
 * Invariant #1: This BC only writes its own aggregate.
 */

import {
  recruitOrganizationMember,
  dismissOrganizationMember,
} from "@/shared/infra/firestore/firestore.facade";
import type { MemberReference } from "@/shared/types";
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";

export async function recruitMember(
  organizationId: string,
  newId: string,
  name: string,
  email: string
): Promise<CommandResult> {
  try {
    await recruitOrganizationMember(organizationId, newId, name, email);
    return commandSuccess(newId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "RECRUIT_MEMBER_FAILED",
      err instanceof Error ? err.message : "Failed to recruit member"
    );
  }
}

export async function dismissMember(
  organizationId: string,
  member: MemberReference
): Promise<CommandResult> {
  try {
    await dismissOrganizationMember(organizationId, member);
    return commandSuccess(member.id, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "DISMISS_MEMBER_FAILED",
      err instanceof Error ? err.message : "Failed to dismiss member"
    );
  }
}
