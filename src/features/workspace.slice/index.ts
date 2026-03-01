/**
 * workspace.slice — VS5 Workspace Slice Public API
 *
 * Consolidated workspace business domain. All VS5 sub-slices are re-exported
 * from this single entry point. External consumers import from '@/features/workspace.slice'.
 *
 * Sub-slices:
 *   core              — workspace aggregate, providers, shell, hooks
 *   core.event-bus    — in-process workspace event bus [E5]
 *   core.event-store  — append-only domain event store (replay/audit only)
 *   application       — command handler, scope guard, policy engine, tx-runner, outbox
 *   gov.role          — workspace-level role management
 *   gov.audit         — workspace and account audit views
 *   gov.audit-convergence — audit bridge / query adapter
 *   gov.members       — workspace member grants + UI
 *   gov.partners      — stub (views at account.slice/org.partner)
 *   gov.teams         — stub (views at account.slice)
 *   business.files    — workspace file storage
 *   business.document-parser — document parsing [A4]
 *   business.parsing-intent  — ParsingIntent digital twin contract
 *   business.tasks    — workspace task management
 *   business.daily    — 施工日誌 (A-track daily log)
 *   business.workflow — workflow aggregate + state machine [R6]
 *   business.quality-assurance — QA capability
 *   business.acceptance        — acceptance capability
 *   business.finance           — finance capability
 *   business.issues            — B-track issues [A3]
 */

// ─── core ────────────────────────────────────────────────────────────────────
export {
  DashboardView,
  WorkspacesView,
  WorkspaceCard,
  WorkspaceGridView,
  WorkspaceNavTabs,
  WorkspaceSettingsDialog,
  WorkspaceStatusBar,
  WorkspaceTableView,
  CreateWorkspaceDialog,
  WorkspaceListHeader,
  WorkspaceProvider,
  useWorkspace,
  AppProvider,
  AppContext,
  AccountProvider,
  AccountContext,
  StatCards,
  useAccount,
  ThemeAdapter,
  Header,
  GlobalSearch,
  NotificationCenter,
  AccountSwitcher,
  AccountCreateDialog,
  DashboardSidebar,
  useVisibleWorkspaces,
  useWorkspaceCommands,
  useWorkspaceEventHandler,
  useApp,
  WorkspaceCapabilities,
  handleCreateWorkspace,
  handleUpdateWorkspaceSettings,
  handleDeleteWorkspace,
  createWorkspaceWithCapabilities,
  createWorkspaceLocation,
  updateWorkspaceLocation,
  deleteWorkspaceLocation,
  WorkspaceLocationsPanel,
} from './core'
export type { AppAction } from './core'

// ─── core.event-bus ──────────────────────────────────────────────────────────
export {
  WorkspaceEventBus,
  WorkspaceEventContext,
  useWorkspaceEvents,
  registerWorkspaceFunnel,
  registerOrganizationFunnel,
  replayWorkspaceProjections,
} from './core.event-bus'
export type {
  WorkspaceEventName,
  WorkspaceEventHandler,
  PublishFn,
  SubscribeFn,
  WorkspaceEventPayloadMap,
  WorkspaceEventPayload,
  WorkspaceTaskCompletedPayload,
  WorkspaceTaskScheduleRequestedPayload,
  QualityAssuranceRejectedPayload,
  WorkspaceAcceptanceFailedPayload,
  WorkspaceQualityAssuranceApprovedPayload,
  WorkspaceAcceptancePassedPayload,
  DocumentParserItemsExtractedPayload,
  DailyLogForwardRequestedPayload,
  FileSendToParserPayload,
  WorkspaceIssueResolvedPayload,
  WorkspaceFinanceDisbursementFailedPayload,
  WorkspaceTaskBlockedPayload,
  WorkspaceTaskAssignedPayload,
  WorkspaceScheduleProposedPayload,
  WorkspaceEventContextType,
} from './core.event-bus'

// ─── core.event-store ────────────────────────────────────────────────────────
export {
  appendDomainEvent,
  getDomainEvents,
} from './core.event-store'
export type { StoredWorkspaceEvent } from './core.event-store'

// ─── application ─────────────────────────────────────────────────────────────
export {
  executeCommand,
  checkWorkspaceAccess,
  evaluatePolicy,
  runTransaction,
  createOutbox,
  registerOrgPolicyCache,
  getCachedOrgPolicy,
  getAllCachedPolicies,
  clearOrgPolicyCache,
} from './application'
export type {
  WorkspaceCommand,
  WorkspaceExecutorResult,
  ScopeGuardResult,
  WorkspaceRole,
  PolicyDecision,
  TransactionContext,
  TransactionResult,
  Outbox,
  OutboxEvent,
  OrgPolicyEntry,
} from './application'

// ─── gov.role ────────────────────────────────────────────────────────────────
export {
  assignWorkspaceRole,
  revokeWorkspaceRole,
  getWorkspaceGrant,
  getWorkspaceGrants,
  useWorkspaceRole,
} from './gov.role'
export type { AssignWorkspaceRoleInput, RevokeWorkspaceRoleInput } from './gov.role'

// ─── gov.audit ───────────────────────────────────────────────────────────────
export {
  WorkspaceAudit,
  AccountAuditComponent,
  AuditDetailSheet,
  AuditEventItem,
  AuditTimeline,
  AuditEventItemContainer,
  AuditTypeIcon,
  useAccountAudit,
  useWorkspaceAudit,
  useLogger,
  getAuditLogs,
} from './gov.audit'
export { default as AccountAuditView } from './gov.audit'

// ─── gov.audit-convergence ───────────────────────────────────────────────────
export {
  DEFAULT_AUDIT_QUERY_LIMIT,
  toAuditProjectionQuery,
} from './gov.audit-convergence'
export type { AuditConvergenceInput, AuditProjectionQuery } from './gov.audit-convergence'

// ─── gov.members ─────────────────────────────────────────────────────────────
export { WorkspaceMembers } from './gov.members'
// Note: getWorkspaceGrants is already exported from gov.role; gov.members re-exports it too
// Avoiding duplicate export — consumers use gov.role or gov.members via workspace.slice

// ─── business.files ──────────────────────────────────────────────────────────
export {
  WorkspaceFiles,
  useStorage,
  useWorkspaceFilters,
  uploadDailyPhoto,
  uploadTaskAttachment,
  uploadProfilePicture,
  uploadRawFile,
  subscribeToWorkspaceFiles,
} from './business.files'

// ─── business.document-parser ────────────────────────────────────────────────
export {
  WorkspaceDocumentParser,
  saveParsingIntent,
  markParsingIntentImported,
  subscribeToParsingIntents,
} from './business.document-parser'

// ─── business.parsing-intent ─────────────────────────────────────────────────
// Note: markParsingIntentImported (pure function) is exported as markParsingIntentContract
// to avoid collision with the server action of the same name in business.document-parser.
export {
  createParsingIntentContract,
  markParsingIntentImported as markParsingIntentContract,
  supersedeParsingIntent,
} from './business.parsing-intent'
export type {
  ParsingIntentContract,
  ParsingIntentStatus,
  CreateParsingIntentInput,
} from './business.parsing-intent'

// ─── business.tasks ──────────────────────────────────────────────────────────
export {
  WorkspaceTasks,
  createTask,
  updateTask,
  deleteTask,
  batchImportTasks,
  getWorkspaceTasks,
  getWorkspaceTask,
} from './business.tasks'

// ─── business.daily ──────────────────────────────────────────────────────────
export {
  WorkspaceDaily,
  AccountDailyComponent,
  DailyLogDialog,
  DailyLogCard,
  DailyLogComposer,
  useWorkspaceDailyLog,
  useAggregatedLogs,
  useDailyActions,
  useBookmarkActions,
  useDailyUpload,
  getDailyLogs,
} from './business.daily'
export { default as AccountDailyView } from './business.daily'

// ─── business.workflow ───────────────────────────────────────────────────────
export {
  WORKFLOW_STAGE_ORDER,
  createWorkflowAggregate,
  canAdvanceWorkflowStage,
  advanceWorkflowStage,
  blockWorkflow,
  isWorkflowUnblocked,
  loadWorkflowState,
  saveWorkflowState,
  updateWorkflowState,
  findWorkflowsBlockedByIssue,
  findWorkflowsByStage,
  handleIssueResolvedForWorkflow,
} from './business.workflow'
export type { WorkflowStage, WorkflowAggregateState } from './business.workflow'

// ─── business.quality-assurance ──────────────────────────────────────────────
export { WorkspaceQualityAssurance } from './business.quality-assurance'

// ─── business.acceptance ─────────────────────────────────────────────────────
export { WorkspaceAcceptance } from './business.acceptance'

// ─── business.finance ────────────────────────────────────────────────────────
export { WorkspaceFinance } from './business.finance'

// ─── business.issues ─────────────────────────────────────────────────────────
export {
  WorkspaceIssues,
  createIssue,
  addCommentToIssue,
  resolveIssue,
} from './business.issues'
