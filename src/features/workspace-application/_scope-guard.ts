/**
 * workspace-application/_scope-guard.ts
 *
 * Validates workspace access for a given caller.
 *
 * Per logic-overview.md invariant #7:
 * Scope Guard reads ONLY local read model — never directly from external event buses.
 *
 * Implementation: queries projection.workspace-scope-guard read model exclusively.
 * Prohibition #7 forbids reading any other slice's state (including the raw workspaces/ collection).
 */

import { queryWorkspaceAccess } from '@/features/projection.workspace-scope-guard';

export interface ScopeGuardResult {
  allowed: boolean;
  role?: string;
  reason?: string;
}

/**
 * Checks whether a user has active access to a workspace.
 * Reads ONLY from projection.workspace-scope-guard read model (Prohibition #7).
 *
 * Returns { allowed: true, role } on success, or { allowed: false, reason } on denial.
 * If the projection is not yet available, access is denied to preserve security invariants.
 */
export async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<ScopeGuardResult> {
  // Query the scope guard projection read model (the only authorised source per Prohibition #7)
  const projectionResult = await queryWorkspaceAccess(workspaceId, userId);
  if (projectionResult.allowed) {
    return { allowed: true, role: projectionResult.role };
  }
  // Projection returned denial or is not yet built — deny access.
  // Per Prohibition #7, we must NOT fall back to the raw workspaces/ aggregate.
  // If the projection is unavailable, callers should retry after the projection is rebuilt.
  return {
    allowed: false,
    reason: projectionResult.role === undefined
      ? 'Scope guard projection unavailable — retry after projection rebuild'
      : 'No active workspace grant for this user',
  };
}
