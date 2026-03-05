/**
 * @fileoverview Barrel file for Firestore repositories.
 * Domain-specific repositories — each owns both reads and writes for its aggregate.
 */

export * from './account.repository'                           // createUserAccount, createOrganization, recruitOrganizationMember, dismissOrganizationMember, createTeam, updateTeamMembers, sendPartnerInvite, dismissPartnerMember, updateOrganizationSettings, deleteOrganization
export * from './user.repository'                              // getUserProfile, updateUserProfile, addBookmark, removeBookmark
export * from './workspace-core.repository'                    // createWorkspace, authorizeWorkspaceTeam, revokeWorkspaceTeam, grantIndividualWorkspaceAccess, revokeIndividualWorkspaceAccess, mountCapabilities, unmountCapability, updateWorkspaceSettings, deleteWorkspace, getWorkspaceFiles, getWorkspaceGrants
export * from './workspace-business.tasks.repository'          // createTask, updateTask, deleteTask, getWorkspaceTasks, getWorkspaceTask, getTaskBySourceIntentId, getTasksBySourceIntentId, reconcileTask
export * from './workspace-business.files.repository'          // createWorkspaceFile, addWorkspaceFileVersion, restoreWorkspaceFileVersion, getWorkspaceFilesFromSubcollection
export * from './workspace-business.issues.repository'         // createIssue, addCommentToIssue, resolveIssue, getWorkspaceIssues
export * from './workspace-business.document-parser.repository'// createParsingIntent, updateParsingIntentStatus, supersedeParsingIntent, getParsingIntents, getParsingIntentBySourceFileId, getParsingIntentById
export * from './workspace-business.parsing-imports.repository'// createParsingImport, getParsingImportByIdempotencyKey, updateParsingImportStatus
export * from './workspace-business.finance.repository'        // getFinanceAggregateState, saveFinanceAggregateState
export * from './workspace-core.event-store.repository'        // appendDomainEvent, getDomainEvents, StoredWorkspaceEvent
export * from './projection.registry.repository'               // getProjectionVersion, upsertProjectionVersion, ProjectionVersionRecord
export * from './schedule.repository'                          // createScheduleItem, updateScheduleItemStatus, updateScheduleItemDateRange, assignMemberToScheduleItem, assignMemberAndApprove, unassignMemberFromScheduleItem, getScheduleItems
export * from './daily.repository'                             // toggleDailyLogLike, addDailyLogComment, getDailyLogs
export * from './audit.repository'                             // getAuditLogs