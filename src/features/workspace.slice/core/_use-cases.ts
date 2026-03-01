/**
 * @fileoverview features/workspace — Multi-step workspace use cases.
 * No React. No UI. Callable from hooks, context, or Server Actions.
 */

import { createWorkspace, mountCapabilities , updateWorkspaceSettings, deleteWorkspace } from "./_actions"
import type { Account, Capability , WorkspaceLifecycleState, Address } from "@/shared/types"
import type { CommandResult } from '@/features/shared-kernel/command-result-contract';

/**
 * Creates a workspace and immediately mounts a set of initial capabilities.
 * Combines two action calls into one atomic use case.
 *
 * @param name         Workspace name
 * @param account      The owning account
 * @param capabilities Initial capabilities to mount (may be empty)
 * @returns            CommandResult — aggregateId is the new workspace ID on success
 */
export async function createWorkspaceWithCapabilities(
  name: string,
  account: Account,
  capabilities: Capability[] = []
): Promise<CommandResult> {
  const result = await createWorkspace(name, account);
  if (!result.success) return result;
  const workspaceId = result.aggregateId;
  if (capabilities.length > 0) {
    const mountResult = await mountCapabilities(workspaceId, capabilities);
    if (!mountResult.success) return mountResult;
  }
  return result;
}

import { toast } from "@/shared/utility-hooks/use-toast"

export const handleCreateWorkspace = async (
  name: string,
  activeAccount: Account | null,
  onSuccess: () => void,
  t: (key: string) => string
) => {
  if (!name.trim() || !activeAccount) {
    toast({ variant: "destructive", title: t("workspaces.creationFailed"), description: t("workspaces.accountNotFound") })
    return
  }
  const result = await createWorkspace(name, activeAccount);
  if (!result.success) {
    toast({ variant: "destructive", title: t("workspaces.failedToCreateSpace"), description: result.error.message })
    return
  }
  toast({ title: t("workspaces.logicalSpaceCreated"), description: t("workspaces.spaceSynchronized").replace("{name}", name) })
  onSuccess()
}

export const handleUpdateWorkspaceSettings = async (
  workspaceId: string,
  settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState; address?: Address },
  onSuccess: () => void
) => {
  const result = await updateWorkspaceSettings(workspaceId, settings);
  if (!result.success) {
    toast({ variant: "destructive", title: "Failed to Update Settings", description: result.error.message })
    return
  }
  toast({ title: "Space settings synchronized" })
  onSuccess()
}

export const handleDeleteWorkspace = async (workspaceId: string, onSuccess: () => void) => {
  const result = await deleteWorkspace(workspaceId);
  if (!result.success) {
    toast({ variant: "destructive", title: "Failed to Destroy Space", description: result.error.message })
    return
  }
  toast({ title: "Workspace node destroyed" })
  onSuccess()
}
