"use client";

/**
 * Module: account-provider.tsx
 * Purpose: host account-level provider lifecycle
 * Responsibilities: subscribe account-scoped projections and expose AccountProvider
 * Constraints: deterministic logic, respect module boundaries
 */

import { type ReactNode, useEffect, useReducer } from 'react'

import {
  subscribeToAuditLogsForAccount,
  subscribeToDailyLogsForAccount,
  subscribeToInvitesForAccount,
  subscribeToScheduleItemsForAccount,
  subscribeToWorkspacesForAccount,
} from './account-provider.queries'

import { type AccountAction, AccountContext, type AccountState } from './account-context'
import { useApp } from './app-provider'

const initialState: AccountState = {
  workspaces: {},
  dailyLogs: {},
  auditLogs: {},
  invites: {},
  schedule_items: {},
}

const accountReducer = (state: AccountState, action: AccountAction): AccountState => {
  switch (action.type) {
    case 'RESET_STATE':
      return initialState

    case 'SET_WORKSPACES': {
      const nextWorkspaces = action.payload
      const updatedWorkspaces = { ...state.workspaces }
      Object.keys(nextWorkspaces).forEach((workspaceId) => {
        updatedWorkspaces[workspaceId] = {
          ...(state.workspaces[workspaceId] || {}),
          ...nextWorkspaces[workspaceId],
        }
      })
      Object.keys(state.workspaces).forEach((workspaceId) => {
        if (!nextWorkspaces[workspaceId]) {
          delete updatedWorkspaces[workspaceId]
        }
      })
      return { ...state, workspaces: updatedWorkspaces }
    }

    case 'SET_DAILY_LOGS':
      return { ...state, dailyLogs: action.payload }

    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.payload }

    case 'SET_INVITES':
      return { ...state, invites: action.payload }

    case 'SET_SCHEDULE_ITEMS':
      return { ...state, schedule_items: action.payload }

    case 'SET_WORKSPACE_TASKS': {
      const { workspaceId, tasks } = action.payload
      const existingWorkspace = state.workspaces[workspaceId]
      if (!existingWorkspace) return state
      return {
        ...state,
        workspaces: {
          ...state.workspaces,
          [workspaceId]: { ...existingWorkspace, tasks },
        },
      }
    }

    case 'SET_WORKSPACE_ISSUES': {
      const { workspaceId, issues } = action.payload
      const existingWorkspace = state.workspaces[workspaceId]
      if (!existingWorkspace) return state
      return {
        ...state,
        workspaces: {
          ...state.workspaces,
          [workspaceId]: { ...existingWorkspace, issues },
        },
      }
    }

    default:
      return state
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { state: appState } = useApp()
  const { activeAccount } = appState
  const [state, dispatch] = useReducer(accountReducer, initialState)

  useEffect(() => {
    if (!activeAccount?.id) {
      dispatch({ type: 'RESET_STATE' })
      return
    }

    const unsubs: Array<() => void> = []

    if (activeAccount.accountType === 'organization') {
      unsubs.push(
        subscribeToDailyLogsForAccount(activeAccount.id, (logs) =>
          dispatch({ type: 'SET_DAILY_LOGS', payload: logs }),
        ),
      )

      unsubs.push(
        subscribeToAuditLogsForAccount(activeAccount.id, (logs) =>
          dispatch({ type: 'SET_AUDIT_LOGS', payload: logs }),
        ),
      )

      unsubs.push(
        subscribeToInvitesForAccount(activeAccount.id, (invites) =>
          dispatch({ type: 'SET_INVITES', payload: invites }),
        ),
      )

      unsubs.push(
        subscribeToScheduleItemsForAccount(activeAccount.id, (items) =>
          dispatch({ type: 'SET_SCHEDULE_ITEMS', payload: items }),
        ),
      )
    }

    unsubs.push(
      subscribeToWorkspacesForAccount(activeAccount.id, (workspaces) =>
        dispatch({ type: 'SET_WORKSPACES', payload: workspaces }),
      ),
    )

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [activeAccount])

  return (
    <AccountContext.Provider value={{ state, dispatch }}>
      {children}
    </AccountContext.Provider>
  )
}
