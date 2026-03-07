/**
 * Module: account-context.ts
 * Purpose: define account provider context contract and shared account state types
 * Responsibilities: own account context shape and exported account type contracts
 * Constraints: deterministic logic, respect module boundaries
 */

import { createContext, type Dispatch } from 'react'

import type { ScheduleItem } from '@/shared-kernel'
import type { PartnerInvite } from '@/shared-kernel'
import type { DailyLog } from '@/features/workspace.slice/business.daily/_types'
import type { WorkspaceIssue } from '@/features/workspace.slice/business.issues/_types'
import type { WorkspaceTask } from '@/features/workspace.slice/business.tasks/_types'
import type { AuditLog } from '@/features/workspace.slice/gov.audit/_types'
import type { Workspace } from '@/features/workspace.slice/core/_types'

export interface AccountState {
  workspaces: Record<string, Workspace>
  dailyLogs: Record<string, DailyLog>
  auditLogs: Record<string, AuditLog>
  invites: Record<string, PartnerInvite>
  schedule_items: Record<string, ScheduleItem>
}

export type AccountAction =
  | { type: 'SET_WORKSPACES'; payload: Record<string, Workspace> }
  | { type: 'SET_DAILY_LOGS'; payload: Record<string, DailyLog> }
  | { type: 'SET_AUDIT_LOGS'; payload: Record<string, AuditLog> }
  | { type: 'SET_INVITES'; payload: Record<string, PartnerInvite> }
  | { type: 'SET_SCHEDULE_ITEMS'; payload: Record<string, ScheduleItem> }
  | { type: 'SET_WORKSPACE_TASKS'; payload: { workspaceId: string; tasks: Record<string, WorkspaceTask> } }
  | { type: 'SET_WORKSPACE_ISSUES'; payload: { workspaceId: string; issues: Record<string, WorkspaceIssue> } }
  | { type: 'RESET_STATE' }

export interface AccountContextValue {
  state: AccountState
  dispatch: Dispatch<AccountAction>
}

export const AccountContext = createContext<AccountContextValue | null>(null)
