/**
 * projection.bus — Public API
 *
 * VS8 Projection Bus: the unified entry point, version registry, and home for
 * all projection view sub-slices.
 *
 * Nodes:
 *   - EVENT_FUNNEL_INPUT: routes events from all buses to individual projection handlers
 *   - PROJECTION_VERSION: event stream offset + read-model version table
 *   - READ_MODEL_REGISTRY: query handler registration for infra.gateway-query
 *
 * Sub-slices (projection views):
 *   account-audit            — ACCOUNT_PROJECTION_AUDIT
 *   account-view             — ACCOUNT_PROJECTION_VIEW (FCM token, authority snapshot)
 *   global-audit-view        — GLOBAL_AUDIT_VIEW [R8]
 *   org-eligible-member-view — ORG_ELIGIBLE_MEMBER_VIEW [#14–#16]
 *   organization-view        — ORGANIZATION_PROJECTION_VIEW
 *   tag-snapshot             — TAG_SNAPSHOT [T5]
 *   workspace-scope-guard    — WORKSPACE_SCOPE_READ_MODEL [#A9]
 *   workspace-view           — WORKSPACE_PROJECTION_VIEW
 *
 * Per logic-overview.md (VS8 Projection Bus):
 *   WORKSPACE_EVENT_BUS + ORGANIZATION_EVENT_BUS + TAG_LIFECYCLE_BUS
 *     → EVENT_FUNNEL_INPUT → all projection slices
 *
 * External consumers import from '@/features/projection.bus'.
 * Consumers call once at app startup:
 *   registerWorkspaceFunnel(bus)
 *   registerOrganizationFunnel()
 *   registerTagFunnel()
 *   registerAllQueryHandlers()
 */

// =================================================================
// Event Funnel (EVENT_FUNNEL_INPUT — sole projection write path #9)
// =================================================================
export {
  registerWorkspaceFunnel,
  registerOrganizationFunnel,
  registerTagFunnel,
  replayWorkspaceProjections,
} from './_funnel';

// =================================================================
// Projection Registry (PROJECTION_VERSION — event stream offset)
// =================================================================
export {
  getProjectionVersion,
  upsertProjectionVersion,
  type ProjectionVersionRecord,
} from './_registry';

// =================================================================
// Query Registration (READ_MODEL_REGISTRY — GW_QUERY routes)
// =================================================================
export { registerAllQueryHandlers } from './_query-registration';

// =================================================================
// account-audit — ACCOUNT_PROJECTION_AUDIT
// =================================================================
export { getAccountAuditEntries, appendAuditEntry } from './account-audit';
export type { AuditProjectionEntry } from './account-audit';

// =================================================================
// account-view — ACCOUNT_PROJECTION_VIEW [#6][#8]
// =================================================================
export { getAccountView, getAccountAuthoritySnapshot, getAccountMembershipTag } from './account-view';
export { projectAccountSnapshot, applyOrgRoleChange, applyAuthoritySnapshot } from './account-view';
export type { AccountViewRecord } from './account-view';

// =================================================================
// global-audit-view — GLOBAL_AUDIT_VIEW [R8]
// =================================================================
export { applyAuditEvent } from './global-audit-view';
export { getGlobalAuditEvents, getGlobalAuditEventsByWorkspace } from './global-audit-view';
export type { GlobalAuditRecord, GlobalAuditQuery } from './global-audit-view';

// =================================================================
// org-eligible-member-view — ORG_ELIGIBLE_MEMBER_VIEW [#14–#16][R7]
// =================================================================
export {
  initOrgMemberEntry,
  removeOrgMemberEntry,
  applyOrgMemberSkillXp,
  updateOrgMemberEligibility,
} from './org-eligible-member-view';
export {
  getOrgMemberEligibility,
  getOrgEligibleMembers,
  getOrgMemberEligibilityWithTier,
  getOrgEligibleMembersWithTier,
  getAllOrgMembersView,
} from './org-eligible-member-view';
export type {
  OrgEligibleMemberEntry,
  OrgMemberSkillWithTier,
  OrgEligibleMemberView,
} from './org-eligible-member-view';

// =================================================================
// organization-view — ORGANIZATION_PROJECTION_VIEW
// =================================================================
export { getOrganizationView, getOrganizationMemberIds } from './organization-view';
export { projectOrganizationSnapshot, applyMemberJoined, applyMemberLeft } from './organization-view';
export type { OrganizationViewRecord } from './organization-view';

// =================================================================
// tag-snapshot — TAG_SNAPSHOT [T5][S4]
// =================================================================
export {
  applyTagCreated,
  applyTagUpdated,
  applyTagDeprecated,
  applyTagDeleted,
} from './tag-snapshot';
export { getTagSnapshot, getAllTagSnapshots, getActiveTagSnapshots } from './tag-snapshot';
export type { TagSnapshotEntry } from './tag-snapshot';

// =================================================================
// workspace-scope-guard — WORKSPACE_SCOPE_READ_MODEL [#A9] CRITICAL ≤500ms
// =================================================================
export { getScopeGuardView, queryWorkspaceAccess } from './workspace-scope-guard';
export { initScopeGuardView, applyGrantEvent } from './workspace-scope-guard';
export { buildAuthoritySnapshot } from './workspace-scope-guard';
export type { WorkspaceScopeGuardView, WorkspaceScopeGrantEntry } from './workspace-scope-guard';

// =================================================================
// workspace-view — WORKSPACE_PROJECTION_VIEW
// =================================================================
export { getWorkspaceView, getWorkspaceCapabilities } from './workspace-view';
export { projectWorkspaceSnapshot, applyCapabilityUpdate } from './workspace-view';
export type { WorkspaceViewRecord } from './workspace-view';
