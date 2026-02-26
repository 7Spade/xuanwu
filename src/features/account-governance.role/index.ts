/**
 * account-governance.role — Public API
 *
 * Account-level role management. Role changes trigger CUSTOM_CLAIMS refresh.
 *
 * Per logic-overview.md: ACCOUNT_ROLE → CUSTOM_CLAIMS
 */

export { assignAccountRole, revokeAccountRole, emitTokenRefreshSignal } from './_actions';
export type { AccountRoleRecord, AssignRoleInput, TokenRefreshSignal, TokenRefreshReason } from './_actions';

export { getAccountRole, subscribeToAccountRoles } from './_queries';

export { useAccountRole } from './_hooks/use-account-role';

export { PermissionMatrixView } from './_components/permission-matrix-view';
export { PermissionTree } from './_components/permission-tree';
