/**
 * workspace-governance.role — _queries.ts
 *
 * Read queries for workspace-level role management.
 */

import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Workspace } from '../core/_types';
import type { WorkspaceGrant } from './_types';

/**
 * Returns the workspace grant for a specific user.
 */
export async function getWorkspaceGrant(
  workspaceId: string,
  userId: string
): Promise<WorkspaceGrant | null> {
  const workspace = await getDocument<Workspace>(`workspaces/${workspaceId}`);
  if (!workspace) return null;
  return (
    workspace.grants.find((g) => g.userId === userId && g.status === 'active') ?? null
  );
}

/**
 * Returns all active grants for a workspace.
 */
export async function getWorkspaceGrants(workspaceId: string): Promise<WorkspaceGrant[]> {
  const workspace = await getDocument<Workspace>(`workspaces/${workspaceId}`);
  if (!workspace) return [];
  return workspace.grants.filter((g) => g.status === 'active');
}
