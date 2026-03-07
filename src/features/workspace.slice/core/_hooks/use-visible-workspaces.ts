
"use client"

import { useMemo } from 'react'

import { useAuth } from '@/app-runtime/providers/auth-provider'

import { filterVisibleWorkspaces } from '@/features/workspace.slice/_workspace.rules'

import { useAccount } from './use-account'
import { useApp } from './use-app'

/**
 * A hook that centralizes the logic for determining which workspaces are visible to the current user
 * based on the active account context.
 *
 * @returns A memoized array of `Workspace` objects that the current user is allowed to see in the active dimension.
 */
export function useVisibleWorkspaces() {
  const { state: appState } = useApp()
  const { state: accountState } = useAccount()
  const { state: authState } = useAuth()

  const { user } = authState
  const { accounts, activeAccount } = appState
  const { workspaces } = accountState

  const visibleWorkspaces = useMemo(() => {
    if (!activeAccount || !user || !workspaces) return []
    return filterVisibleWorkspaces(
      Object.values(workspaces),
      user.id,
      activeAccount,
      accounts
    )
  }, [workspaces, activeAccount, accounts, user])

  return visibleWorkspaces
}
