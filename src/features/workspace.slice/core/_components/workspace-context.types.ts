/**
 * Module: workspace-context.types.ts
 * Purpose: Define shared context contracts for WorkspaceProvider.
 * Responsibilities: centralize provider value types and action signatures.
 * Constraints: deterministic logic, respect module boundaries
 */

import type { ScheduleItem, CommandResult } from '@/shared-kernel';

import type { WorkspaceTask } from '@/features/workspace.slice/business.tasks/_types';
import type { FileSendToParserPayload } from '@/features/workspace.slice/core.event-bus';
import type { WorkspaceRole } from '@/features/workspace.slice/gov.role/_types';
import type {
  Address,
  Capability,
  Workspace,
  WorkspaceLifecycleState,
  WorkspacePersonnel,
} from '../_types';

import type { WorkflowBlockersState } from './workflow-blockers-state';

export type CreateScheduleItemInput = Omit<
  ScheduleItem,
  'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'
> & {
  startDate?: Date | null;
  endDate?: Date | null;
};

export interface WorkspaceContextType {
  workspace: Workspace;
  localAuditLogs: import('../../gov.audit/_types').AuditLog[];
  logAuditEvent: (action: string, detail: string, type: 'create' | 'update' | 'delete') => Promise<void>;
  eventBus: import('../../core.event-bus').WorkspaceEventBus;
  protocol: string;
  scope: string[];
  createTask: (task: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommandResult>;
  updateTask: (taskId: string, updates: Partial<WorkspaceTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<CommandResult>;
  authorizeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  revokeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  grantIndividualWorkspaceAccess: (userId: string, role: WorkspaceRole, protocol?: string) => Promise<CommandResult>;
  revokeIndividualWorkspaceAccess: (grantId: string) => Promise<CommandResult>;
  mountCapabilities: (capabilities: Capability[]) => Promise<CommandResult>;
  unmountCapability: (capability: Capability) => Promise<CommandResult>;
  updateWorkspaceSettings: (settings: {
    name: string;
    visibility: 'visible' | 'hidden';
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
  }) => Promise<CommandResult>;
  deleteWorkspace: () => Promise<CommandResult>;
  createIssue: (title: string, type: 'technical' | 'financial', priority: 'high' | 'medium', sourceTaskId?: string) => Promise<CommandResult>;
  addCommentToIssue: (issueId: string, author: string, content: string) => Promise<CommandResult>;
  resolveIssue: (issueId: string, issueTitle: string, resolvedBy: string, sourceTaskId?: string) => Promise<void>;
  createScheduleItem: (itemData: CreateScheduleItemInput) => Promise<CommandResult>;
  pendingParseFile: FileSendToParserPayload | null;
  setPendingParseFile: (payload: FileSendToParserPayload | null) => void;
  workflowBlockers: WorkflowBlockersState;
  blockedWorkflowCount: number;
  totalBlockedByCount: number;
  hasBlockedWorkflows: boolean;
}
