'use server';

/**
 * workspace-governance.role — _actions.ts
 *
 * Server actions for workspace-level role management.
 *
 * Per logic-overview.md:
 *   WORKSPACE_ROLE — split from workspace-governance.members, workspace access control only.
 *   Does NOT sign CUSTOM_CLAIMS; that is account-governance.role's responsibility.
 *
 * Invariant #1: This BC only writes its own aggregate (workspace grants).
 */

import {
  grantIndividualWorkspaceAccess,
  revokeIndividualWorkspaceAccess,
} from '@/shared/infra/firestore/firestore.facade';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';
import type { WorkspaceRole } from '@/shared/types';

export interface AssignWorkspaceRoleInput {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  protocol?: string;
}

export interface RevokeWorkspaceRoleInput {
  workspaceId: string;
  userId: string;
}

/**
 * Assigns a workspace-level role to a user.
 * Delegates to the workspace core repository — atomic grant guard included.
 */
export async function assignWorkspaceRole(input: AssignWorkspaceRoleInput): Promise<CommandResult> {
  try {
    await grantIndividualWorkspaceAccess(
      input.workspaceId,
      input.userId,
      input.role,
      input.protocol
    );
    return commandSuccess(input.workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_ROLE_ASSIGN_FAILED', message);
  }
}

/**
 * Revokes a workspace-level role from a user.
 */
export async function revokeWorkspaceRole(input: RevokeWorkspaceRoleInput): Promise<CommandResult> {
  try {
    await revokeIndividualWorkspaceAccess(input.workspaceId, input.userId);
    return commandSuccess(input.workspaceId, Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('WORKSPACE_ROLE_REVOKE_FAILED', message);
  }
}
