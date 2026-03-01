/**
 * collection-paths.ts — Firestore Collection Path Constants
 *
 * [D24] All Firestore collection paths must be defined here.
 *       Feature slices must NOT hardcode collection paths directly.
 *
 * Usage:
 *   import { COLLECTIONS } from '@/shared/infra/firestore/collection-paths';
 *   const ref = db.collection(COLLECTIONS.accounts).doc(orgId);
 */

/** Top-level collection path constants. */
export const COLLECTIONS = {
  /** VS2 Account aggregate root. */
  accounts: 'accounts',
  /** VS2 User profiles (sub-collection not listed — use SUBCOLLECTIONS). */
  userProfiles: 'user_profiles',
  /** VS8 Projection: workspace scope guard view. */
  workspaceScopeGuardView: 'workspace-scope-guard-view',
  /** VS8 Projection: org eligible member view. */
  orgEligibleMemberView: 'org-eligible-member-view',
  /** VS8 Projection: account view. */
  accountView: 'account-view',
  /** VS8 Projection: organization view. */
  organizationView: 'organization-view',
  /** VS8 Projection: global audit view [R8]. */
  globalAuditView: 'global-audit-view',
  /** VS8 Projection: tag snapshot [S4]. */
  tagSnapshot: 'tag-snapshot',
  /** VS8 Projection registry (version tracking) [S2]. */
  projectionRegistry: 'projection-registry',
  /** VS9 Domain error log. */
  domainErrorLog: 'domain-error-log',
} as const;

/** Sub-collection paths (appended to an account document path). */
export const SUBCOLLECTIONS = {
  /** accounts/{orgId}/workspaces */
  workspaces: 'workspaces',
  /** accounts/{orgId}/schedule_items — VS6 SSOT [S4] */
  scheduleItems: 'schedule_items',
  /** accounts/{orgId}/audit_logs */
  auditLogs: 'audit_logs',
  /** accounts/{orgId}/daily_logs */
  dailyLogs: 'daily_logs',
  /** workspaces/{workspaceId}/events — VS5 event store */
  workspaceEvents: 'events',
  /** workspaces/{workspaceId}/tasks */
  workspaceTasks: 'tasks',
  /** workspaces/{workspaceId}/issues */
  workspaceIssues: 'issues',
  /** workspaces/{workspaceId}/files */
  workspaceFiles: 'files',
  /** workspaces/{workspaceId}/grants */
  workspaceGrants: 'grants',
  /** workspaces/{workspaceId}/locations */
  workspaceLocations: 'locations',
  /** workspaces/{workspaceId}/parsing_intents */
  parsingIntents: 'parsing_intents',
  /** Generic outbox sub-collection (per aggregate) */
  outbox: 'outbox',
} as const;
