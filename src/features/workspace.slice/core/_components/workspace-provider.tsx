
"use client";

import { Loader2 } from 'lucide-react';
import type React from 'react';
import { createContext, useContext, useMemo, useCallback, useEffect, useRef, useState } from 'react';

import { initTagChangedSubscriber } from '@/features/notification-hub.slice';
import {
  createScheduleItem as createScheduleItemAction,
} from '@/features/scheduling.slice'
import type { CommandResult, ScheduleItem } from '@/features/shared-kernel';
import { firestoreTimestampToISO } from '@/shared/shadcn-ui/utils/utils';
import type { Workspace, WorkspaceLifecycleState, Capability, Address, WorkspacePersonnel } from '../_types';
import type { AuditLog } from '../../gov.audit/_types';
import type { WorkspaceTask } from '../../business.tasks/_types';
import type { WorkspaceRole } from '../../gov.role/_types';

import { registerOrgPolicyCache, runTransaction } from '../../application';
import {
  createIssue as createIssueAction,
  addCommentToIssue as addCommentToIssueAction,
  resolveIssue as resolveIssueAction,
} from '../../business.issues'
import { 
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  getWorkspaceTask as getWorkspaceTaskAction,
} from '../../business.tasks'
import { listWorkflowStates } from '../../business.workflow'
import { WorkspaceEventBus , WorkspaceEventContext, registerWorkspaceFunnel, registerOrganizationFunnel, type WorkspaceEventName, type FileSendToParserPayload } from '../../core.event-bus';
import { writeAuditLog } from '../../gov.audit/_actions';
import {
  authorizeWorkspaceTeam as authorizeWorkspaceTeamAction,
  revokeWorkspaceTeam as revokeWorkspaceTeamAction,
  grantIndividualWorkspaceAccess as grantIndividualWorkspaceAccessAction,
  revokeIndividualWorkspaceAccess as revokeIndividualWorkspaceAccessAction,
  mountCapabilities as mountCapabilitiesAction,
  unmountCapability as unmountCapabilityAction,
  updateWorkspaceSettings as updateWorkspaceSettingsAction,
  deleteWorkspace as deleteWorkspaceAction,
} from '../_actions'
import { useAccount } from '../_hooks/use-account';
import { useApp } from '../_hooks/use-app';
import { subscribeToWorkspaceTasks, subscribeToWorkspaceIssues } from '../_queries';

import {
  applyWorkflowBlocked,
  applyWorkflowUnblocked,
  deriveWorkflowBlockersFromSources,
  summarizeWorkflowBlockers,
  type WorkflowBlockersState,
} from './workflow-blockers-state';

interface WorkspaceContextType {
  workspace: Workspace;
  localAuditLogs: AuditLog[];
  logAuditEvent: (action: string, detail: string, type: 'create' | 'update' | 'delete') => Promise<void>;
  eventBus: WorkspaceEventBus;
  protocol: string;
  scope: string[];
  // Task specific actions
  createTask: (task: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommandResult>;
  updateTask: (taskId: string, updates: Partial<WorkspaceTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<CommandResult>;
  // Member management actions
  authorizeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  revokeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  grantIndividualWorkspaceAccess: (userId: string, role: WorkspaceRole, protocol?: string) => Promise<CommandResult>;
  revokeIndividualWorkspaceAccess: (grantId: string) => Promise<CommandResult>;
  // Capability management
  mountCapabilities: (capabilities: Capability[]) => Promise<CommandResult>;
  unmountCapability: (capability: Capability) => Promise<CommandResult>;
  // Workspace settings
  updateWorkspaceSettings: (settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState; address?: Address; personnel?: WorkspacePersonnel }) => Promise<CommandResult>;
  deleteWorkspace: () => Promise<CommandResult>;
  // Issue Management
  createIssue: (title: string, type: 'technical' | 'financial', priority: 'high' | 'medium', sourceTaskId?: string) => Promise<CommandResult>;
  addCommentToIssue: (issueId: string, author: string, content: string) => Promise<CommandResult>;
  /** Resolves a B-track issue via the Transaction Runner + Outbox pipeline. */
  resolveIssue: (issueId: string, issueTitle: string, resolvedBy: string, sourceTaskId?: string) => Promise<void>;
  // Schedule Management
  createScheduleItem: (itemData: CreateScheduleItemInput) => Promise<CommandResult>;
  // Pending parse file — set by files-view when "Parse with AI" is clicked;
  // read by document-parser on mount to auto-trigger parsing cross-tab.
  pendingParseFile: FileSendToParserPayload | null;
  setPendingParseFile: (payload: FileSendToParserPayload | null) => void;
  workflowBlockers: WorkflowBlockersState;
  blockedWorkflowCount: number;
  totalBlockedByCount: number;
  hasBlockedWorkflows: boolean;
}

/** Input type for createScheduleItem — accepts plain Date objects; the action converts to Timestamp internally. */
export type CreateScheduleItemInput = Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
  startDate?: Date | null;
  endDate?: Date | null;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ workspaceId, children }: { workspaceId: string, children: React.ReactNode }) {
  const { state: accountState, dispatch: accountDispatch } = useAccount();
  const { state: appState } = useApp();
  const { workspaces, auditLogs } = accountState;
  const { activeAccount } = appState;
  const workspace = workspaces[workspaceId];

  // eslint-disable-next-line react-hooks/exhaustive-deps -- workspaceId is an intentional reset key: recreate bus when active workspace changes
  const eventBus = useMemo(() => new WorkspaceEventBus(), [workspaceId]);

  // Pending parse file — bridges the cross-tab gap between files-view (publisher)
  // and document-parser-view (subscriber), which are on separate @businesstab slots.
  const [pendingParseFile, setPendingParseFile] = useState<FileSendToParserPayload | null>(null);
  const [workflowBlockers, setWorkflowBlockers] = useState<WorkflowBlockersState>({});
  const touchedWorkflowIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to workspace subcollections (tasks, issues) so that all views
  // always reflect the current Firestore state without manual refreshes.
  // Updates are dispatched into account state so the existing merge logic in
  // SET_WORKSPACES continues to work correctly as the single source of truth.
  useEffect(() => {
    const unsubTasks = subscribeToWorkspaceTasks(workspaceId, (tasks) => {
      accountDispatch({ type: 'SET_WORKSPACE_TASKS', payload: { workspaceId, tasks } });
    });
    const unsubIssues = subscribeToWorkspaceIssues(workspaceId, (issues) => {
      accountDispatch({ type: 'SET_WORKSPACE_ISSUES', payload: { workspaceId, issues } });
    });
    return () => {
      unsubTasks();
      unsubIssues();
    };
  }, [workspaceId, accountDispatch]);

  // Register Event Funnel — routes events from both buses to the Projection Layer
  // Also register Notification Router (FCM Layer 2) and Org Policy Cache
  useEffect(() => {
    const unsubWorkspace = registerWorkspaceFunnel(eventBus);
    const unsubOrg = registerOrganizationFunnel();
    const unsubNotif = initTagChangedSubscriber();
    const unsubPolicy = registerOrgPolicyCache();
    return () => {
      unsubWorkspace();
      unsubOrg();
      unsubNotif();
      unsubPolicy();
    };
  }, [eventBus]);

  useEffect(() => {
    let isCanceled = false
    const eventTouchedWorkflowIds = touchedWorkflowIdsRef.current
    eventTouchedWorkflowIds.clear()

    const hydrateWorkflowBlockers = async () => {
      try {
        if (isCanceled) return
        const workflowStates = await listWorkflowStates(workspaceId)
        if (isCanceled) return

        const hydratedState = deriveWorkflowBlockersFromSources(workflowStates)
        setWorkflowBlockers((prev) => {
          const next = { ...prev }
          for (const [workflowId, blockedByCount] of Object.entries(hydratedState)) {
            if (eventTouchedWorkflowIds.has(workflowId)) continue
            if (next[workflowId] === undefined) {
              next[workflowId] = blockedByCount
            }
          }
          return next
        })
      } catch (error) {
        console.error('[workspace-provider] Failed to hydrate workflow blockers:', error)
      }
    }

    void hydrateWorkflowBlockers()

    // A/B handoff sync: when workflow aggregate emits blocked, blockedBy gains at least one issueId.
    const unsubBlocked = eventBus.subscribe('workspace:workflow:blocked', (payload) => {
      eventTouchedWorkflowIds.add(payload.workflowId)
      setWorkflowBlockers((prev) =>
        applyWorkflowBlocked(prev, payload.workflowId, payload.blockedByCount)
      );
    });

    // A/B handoff sync: unblocked means blockedBy was reduced; remove the workflow once count reaches zero.
    const unsubUnblocked = eventBus.subscribe('workspace:workflow:unblocked', (payload) => {
      eventTouchedWorkflowIds.add(payload.workflowId)
      setWorkflowBlockers((prev) =>
        applyWorkflowUnblocked(prev, payload.workflowId, payload.blockedByCount)
      );
    });

    return () => {
      isCanceled = true
      unsubBlocked();
      unsubUnblocked();
    };
  }, [eventBus, workspaceId]);

  const localAuditLogs = useMemo(() => {
    if (!auditLogs || !workspaceId) return [];
    return Object.values(auditLogs).filter(log => log.workspaceId === workspaceId);
  }, [auditLogs, workspaceId]);
  
  const logAuditEvent = useCallback(async (action: string, detail: string, type: 'create' | 'update' | 'delete') => {
    if (!activeAccount || activeAccount.accountType !== 'organization') return;
    await writeAuditLog({
      accountId: activeAccount.id,
      actor: activeAccount.name,
      action,
      target: detail,
      type,
      workspaceId,
    });
  }, [activeAccount, workspaceId]);

  const createTask = useCallback(async (task: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>) => createTaskAction(workspaceId, task), [workspaceId]);
  const updateTask = useCallback(async (taskId: string, updates: Partial<WorkspaceTask>) => {
    await updateTaskAction(workspaceId, taskId, updates);
    // Schedule trigger chain: task assignment change → workspace:tasks:assigned → W_B_SCHEDULE.
    // Only publish when a non-empty assigneeId is provided (assignment, not un-assignment).
    if (updates.assigneeId) {
      // Fetch task data from workspace-business.tasks BC boundary (not from workspace aggregate).
      const taskData = await getWorkspaceTaskAction(workspaceId, taskId);
      eventBus.publish('workspace:tasks:assigned', {
        taskId,
        taskName: taskData?.name ?? taskId,
        assigneeId: updates.assigneeId,
        workspaceId,
        sourceIntentId: taskData?.sourceIntentId,
        requiredSkills: taskData?.requiredSkills,
      });
    }
  }, [workspaceId, eventBus]);
  const deleteTask = useCallback(async (taskId: string) => deleteTaskAction(workspaceId, taskId), [workspaceId]);
  
  const authorizeWorkspaceTeam = useCallback(async (teamId: string) => authorizeWorkspaceTeamAction(workspaceId, teamId), [workspaceId]);
  const revokeWorkspaceTeam = useCallback(async (teamId: string) => revokeWorkspaceTeamAction(workspaceId, teamId), [workspaceId]);
  const grantIndividualWorkspaceAccess = useCallback(async (userId: string, role: WorkspaceRole, protocol?: string) => grantIndividualWorkspaceAccessAction(workspaceId, userId, role, protocol), [workspaceId]);
  const revokeIndividualWorkspaceAccess = useCallback(async (grantId: string) => revokeIndividualWorkspaceAccessAction(workspaceId, grantId), [workspaceId]);
  
  const mountCapabilities = useCallback(async (capabilities: Capability[]) => mountCapabilitiesAction(workspaceId, capabilities), [workspaceId]);
  const unmountCapability = useCallback(async (capability: Capability) => unmountCapabilityAction(workspaceId, capability), [workspaceId]);
  
  const updateWorkspaceSettings = useCallback(async (settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState; address?: Address; personnel?: WorkspacePersonnel }) => updateWorkspaceSettingsAction(workspaceId, settings), [workspaceId]);
  const deleteWorkspace = useCallback(async () => deleteWorkspaceAction(workspaceId), [workspaceId]);

  const createIssue = useCallback(async (title: string, type: 'technical' | 'financial', priority: 'high' | 'medium', sourceTaskId?: string) => createIssueAction(workspaceId, title, type, priority, sourceTaskId), [workspaceId]);
  const addCommentToIssue = useCallback(async (issueId: string, author: string, content: string) => addCommentToIssueAction(workspaceId, issueId, author, content), [workspaceId]);
  // Outbox-encapsulated resolve: Firestore write + event collection happen inside
  // Transaction Runner; events are flushed to the Event Bus only after the write commits.
  const resolveIssue = useCallback(async (issueId: string, issueTitle: string, resolvedBy: string, sourceTaskId?: string) => {
    const { events } = await runTransaction(workspaceId, resolvedBy, async (ctx) => {
      await resolveIssueAction(workspaceId, issueId);
      ctx.outbox.collect('workspace:issues:resolved', { issueId, issueTitle, resolvedBy, sourceTaskId });
    });
    for (const event of events) {
      eventBus.publish(event.type as WorkspaceEventName, event.payload as never);
    }
  }, [workspaceId, eventBus]);

  const createScheduleItem = useCallback(async (itemData: CreateScheduleItemInput) => {
    const result = await createScheduleItemAction(itemData);
    // Cross-layer Outbox event: WORKSPACE_OUTBOX →|workspace:schedule:proposed| ORGANIZATION_SCHEDULE
    // Per logic-overview.md: W_B_SCHEDULE publishes this event so scheduling.slice
    // can persist a schedule_item and start the HR governance approval flow.
    if (result.success) {
      if (workspace?.dimensionId) {
        // [R8] Inject traceId at CBG_ENTRY (this is the top of the scheduling saga chain).
        // Use Web Crypto API (available in modern browsers and Node 18+).
        const traceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        eventBus.publish('workspace:schedule:proposed', {
          scheduleItemId: result.aggregateId,
          workspaceId: workspaceId,
          orgId: workspace.dimensionId,
          title: itemData.title,
          startDate: firestoreTimestampToISO(itemData.startDate),
          endDate: firestoreTimestampToISO(itemData.endDate),
          proposedBy: activeAccount?.id ?? 'system',
          skillRequirements: itemData.requiredSkills,
          traceId,
        });
      } else {
        // [D22] Do not expose internal aggregate IDs in the production console.
        // The message is useful for local debugging but must not leak Firestore
        // document IDs to end-users who have DevTools open in production.
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[W_B_SCHEDULE] workspace:schedule:proposed not published for item "${result.aggregateId}" — workspace.dimensionId is missing. Org-level scheduling will not be triggered.`
          );
        }
      }
    }
    return result;
  }, [workspaceId, workspace?.dimensionId, activeAccount?.id, eventBus]);


  const workflowBlockersSummary = summarizeWorkflowBlockers(workflowBlockers);

  if (!workspace) {
    return (
      <div className="flex size-full flex-col items-center justify-center space-y-4 bg-background p-20">
        <div className="animate-bounce text-4xl">🐢</div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Entering logical space...
        </div>
      </div>
    );
  }

  const value: WorkspaceContextType = {
    workspace,
    localAuditLogs,
    logAuditEvent,
    eventBus,
    protocol: workspace.protocol || 'Default',
    scope: workspace.scope || [],
    createTask,
    updateTask,
    deleteTask,
    authorizeWorkspaceTeam,
    revokeWorkspaceTeam,
    grantIndividualWorkspaceAccess,
    revokeIndividualWorkspaceAccess,
    mountCapabilities,
    unmountCapability,
    updateWorkspaceSettings,
    deleteWorkspace,
    createIssue,
    addCommentToIssue,
    resolveIssue,
    createScheduleItem,
    pendingParseFile,
    setPendingParseFile,
    workflowBlockers,
    blockedWorkflowCount: workflowBlockersSummary.blockedWorkflowCount,
    totalBlockedByCount: workflowBlockersSummary.totalBlockedByCount,
    hasBlockedWorkflows: workflowBlockersSummary.hasBlockedWorkflows,
  };

    return (
    <WorkspaceEventContext.Provider value={{ publish: eventBus.publish, subscribe: eventBus.subscribe }}>
      <WorkspaceContext.Provider value={value}>
        {children}
      </WorkspaceContext.Provider>
    </WorkspaceEventContext.Provider>
  );
}


export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
