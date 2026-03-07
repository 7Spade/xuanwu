"use client"

/**
 * Module: app-provider.tsx
 * Purpose: host app-level provider lifecycle and consumer hook
 * Responsibilities: subscribe account stream, own reducer lifecycle, expose useApp
 * Constraints: deterministic logic, respect module boundaries
 *
 * Active Account Context ??cross-cutting identity state.
 *
 * Holds the set of accounts visible to the current user plus the
 * currently active account selection.  This context is consumed by
 * both the Subject Center slices (account-organization.*, account-user.*,
 * account-governance.*) and the Workspace Container (workspace-core)
 * without creating a circular dependency.
 *
 * Dependency direction:
 *   Subject Center ????shared/app-providers/app-context  ??? workspace-core
 *
 * NOT a Workspace Container concern ??account selection predates any
 * workspace context and must be accessible to Subject Center slices.
 */

import { type ReactNode, useReducer, useEffect } from 'react'
import { useContext } from 'react'

import { AppContext, type AppAction, type AppState } from './app-context'

import { subscribeToAccountsForUser } from './app-provider.queries'
import { useAuth } from './auth-provider'

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AppState = {
  accounts: {},
  activeAccount: null,
  notifications: [],
  capabilitySpecs: [
    { id: 'capabilities', name: 'Capabilities', type: 'ui', status: 'stable', description: 'Manage the atomic capabilities mounted to this workspace.' },
    { id: 'members', name: 'Members', type: 'governance', status: 'stable', description: 'Manages granular, grant-based authorization for teams and individuals.' },
    { id: 'audit', name: 'Audit', type: 'monitoring', status: 'stable', description: 'Provides a real-time event stream for all significant state changes.' },
    { id: 'tasks', name: 'Tasks', type: 'ui', status: 'stable', description: 'Track concrete action items within the workspace node.' },
    { id: 'quality-assurance', name: 'QA', type: 'ui', status: 'stable', description: 'Governance unit for verifying the quality of atomic data execution.' },
    { id: 'acceptance', name: 'Acceptance', type: 'ui', status: 'stable', description: 'Accept workspace deliverables and terminate A-Track resonance.' },
    { id: 'finance', name: 'Finance', type: 'ui', status: 'beta', description: 'Track dimension budgets and post-acceptance fund disbursement.' },
    { id: 'issues', name: 'Issues', type: 'ui', status: 'stable', description: 'Governance module for handling technical conflicts and B-Track anomalies.' },
    { id: 'daily', name: 'Daily', type: 'ui', status: 'stable', description: 'A minimalist activity wall for technical collaboration within the space.' },
    { id: 'files', name: 'Files', type: 'data', status: 'stable', description: 'Manage document sovereignty and technical assets within the dimension.' },
    { id: 'schedule', name: 'Schedule', type: 'ui', status: 'stable', description: 'View and manage the adoption timeline for the workspace.' },
    { id: 'document-parser', name: 'Document Parser', type: 'ui', status: 'beta', description: 'Intelligently parse and extract data from documents like invoices and quotes.' },
  ],
  scheduleTaskRequest: null,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_ACCOUNT':
      if (state.activeAccount?.id === action.payload?.id) return state
      return { ...state, activeAccount: action.payload }

    case 'RESET_STATE':
      return initialState

    case 'SET_ACCOUNTS': {
      const { accounts, user } = action.payload
      let newActiveAccount = state.activeAccount
      const availableAccountIds = [user.id, ...Object.keys(accounts)]
      if (!newActiveAccount || !availableAccountIds.includes(newActiveAccount.id)) {
        newActiveAccount = user
      }
      return { ...state, accounts, activeAccount: newActiveAccount }
    }

    case 'ADD_NOTIFICATION': {
      const newNotification = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        read: false,
      }
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 50),
      }
    }

    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) }

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }

    case 'REQUEST_SCHEDULE_TASK':
      return { ...state, scheduleTaskRequest: action.payload }

    case 'CLEAR_SCHEDULE_TASK_REQUEST':
      return { ...state, scheduleTaskRequest: null }

    default:
      return state
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { state: authState } = useAuth()
  const { user, authInitialized } = authState
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    if (!authInitialized) return

    let unsubscribe: (() => void) | null = null

    if (user?.id) {
      unsubscribe = subscribeToAccountsForUser(user.id, (accounts) =>
        dispatch({ type: 'SET_ACCOUNTS', payload: { accounts, user } }),
      )
    } else {
      dispatch({ type: 'RESET_STATE' })
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [authInitialized, user])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------


export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
