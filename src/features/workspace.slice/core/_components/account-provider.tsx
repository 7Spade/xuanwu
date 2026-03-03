"use client";

import type React from 'react';
import {type ReactNode} from 'react';
import { createContext, useReducer, useEffect } from 'react';

import type { ScheduleItem } from '@/features/shared-kernel';
import { type Workspace, type DailyLog, type AuditLog, type PartnerInvite } from '@/shared/types';

import { useApp } from '../_hooks/use-app';
import {
  subscribeToDailyLogsForAccount,
  subscribeToAuditLogsForAccount,
  subscribeToInvitesForAccount,
  subscribeToScheduleItemsForAccount,
  subscribeToWorkspacesForAccount,
} from '../_queries';

// State and Action Types
interface AccountState {
  workspaces: Record<string, Workspace>;
  dailyLogs: Record<string, DailyLog>;
  auditLogs: Record<string, AuditLog>;
  invites: Record<string, PartnerInvite>;
  schedule_items: Record<string, ScheduleItem>;
}

type Action =
  | { type: 'SET_WORKSPACES'; payload: Record<string, Workspace> }
  | { type: 'SET_DAILY_LOGS'; payload: Record<string, DailyLog> }
  | { type: 'SET_AUDIT_LOGS'; payload: Record<string, AuditLog> }
  | { type: 'SET_INVITES'; payload: Record<string, PartnerInvite> }
  | { type: 'SET_SCHEDULE_ITEMS'; payload: Record<string, ScheduleItem> }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: AccountState = {
  workspaces: {},
  dailyLogs: {},
  auditLogs: {},
  invites: {},
  schedule_items: {},
};

// Reducer
const accountReducer = (state: AccountState, action: Action): AccountState => {
  switch (action.type) {
    case 'RESET_STATE':
        return initialState;

    case 'SET_WORKSPACES': {
        const newWorkspaces = action.payload;
        // Preserve subcollections from old state when workspace list is updated
        // This is important because subcollection listeners are in WorkspaceProvider now
        const updatedWorkspaces = { ...state.workspaces };
        Object.keys(newWorkspaces).forEach(id => {
            updatedWorkspaces[id] = {
                ...(state.workspaces[id] || {}), // Keep existing sub-collection data
                ...newWorkspaces[id], // Overwrite with fresh top-level data
            };
        });
        // Also handle deletions
        Object.keys(state.workspaces).forEach(id => {
          if (!newWorkspaces[id]) {
            delete updatedWorkspaces[id];
          }
        })
        return { ...state, workspaces: updatedWorkspaces };
    }
    
    case 'SET_DAILY_LOGS':
        return { ...state, dailyLogs: action.payload };

    case 'SET_AUDIT_LOGS':
        return { ...state, auditLogs: action.payload };
        
    case 'SET_INVITES':
        return { ...state, invites: action.payload };
    
    case 'SET_SCHEDULE_ITEMS':
        return { ...state, schedule_items: action.payload };

    default:
      return state;
  }
};


// Context
export const AccountContext = createContext<{ state: AccountState; dispatch: React.Dispatch<Action> } | null>(null);

// Provider
export const AccountProvider = ({ children }: { children: ReactNode }) => {
    const { state: appState } = useApp();
    const { activeAccount } = appState;
    const [state, dispatch] = useReducer(accountReducer, initialState);

    useEffect(() => {
        if (!activeAccount?.id) {
            dispatch({ type: 'RESET_STATE' })
            return
        };

        const unsubs: (() => void)[] = []

        // 1. Listen to top-level collections for the active account
        if (activeAccount.accountType === 'organization') {
            unsubs.push(subscribeToDailyLogsForAccount(activeAccount.id, (logs) =>
              dispatch({ type: 'SET_DAILY_LOGS', payload: logs })))

            unsubs.push(subscribeToAuditLogsForAccount(activeAccount.id, (logs) =>
              dispatch({ type: 'SET_AUDIT_LOGS', payload: logs })))
            
            unsubs.push(subscribeToInvitesForAccount(activeAccount.id, (invites) =>
              dispatch({ type: 'SET_INVITES', payload: invites })))

            unsubs.push(subscribeToScheduleItemsForAccount(activeAccount.id, (items) =>
              dispatch({ type: 'SET_SCHEDULE_ITEMS', payload: items })))
        }
        
        unsubs.push(subscribeToWorkspacesForAccount(activeAccount.id, (workspaces) =>
          dispatch({ type: 'SET_WORKSPACES', payload: workspaces })))
        
        return () => {
            unsubs.forEach(unsub => unsub())
        }

    }, [activeAccount])

    return (
        <AccountContext.Provider value={{ state, dispatch }}>
        {children}
        </AccountContext.Provider>
    );
};
