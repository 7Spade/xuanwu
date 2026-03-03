/**
 * @fileoverview shared/constants/roles.ts — Role metadata for OrganizationRole & WorkspaceRole.
 *
 * Provides ordered arrays and labelled metadata for dropdown rendering, badge colouring,
 * and permission-level comparisons.  The canonical string-union types themselves live in
 * `@/shared/types/account.types` (the source of truth for type-checking).
 *
 * Usage:
 *   import { ORG_ROLE_META, ORGANIZATION_ROLES } from '@/shared/constants/roles';
 */

import type { OrganizationRole } from '@/shared/types/account.types';
import type { WorkspaceRole } from '@/shared/types/workspace.types';

// ---------------------------------------------------------------------------
// Organization roles
// ---------------------------------------------------------------------------

/** Stable ordered list of OrganizationRole values — lowest to highest rank. */
export const ORGANIZATION_ROLES: readonly OrganizationRole[] = [
  'Guest',
  'Member',
  'Admin',
  'Owner',
] as const;

export interface OrgRoleMeta {
  role: OrganizationRole;
  /** Chinese display label */
  zhLabel: string;
  /** English display label */
  enLabel: string;
  /** Numeric rank (1 = lowest, 4 = highest). Used for permission comparisons. */
  rank: 1 | 2 | 3 | 4;
  /** Tailwind colour class for badge / chip. */
  colorClass: string;
}

/** Metadata for each OrganizationRole, keyed by role string. */
export const ORG_ROLE_META: Record<OrganizationRole, OrgRoleMeta> = {
  Owner: {
    role: 'Owner',
    zhLabel: '擁有者',
    enLabel: 'Owner',
    rank: 4,
    colorClass: 'bg-violet-100 text-violet-800',
  },
  Admin: {
    role: 'Admin',
    zhLabel: '管理員',
    enLabel: 'Admin',
    rank: 3,
    colorClass: 'bg-blue-100 text-blue-800',
  },
  Member: {
    role: 'Member',
    zhLabel: '成員',
    enLabel: 'Member',
    rank: 2,
    colorClass: 'bg-green-100 text-green-800',
  },
  Guest: {
    role: 'Guest',
    zhLabel: '訪客',
    enLabel: 'Guest',
    rank: 1,
    colorClass: 'bg-gray-100 text-gray-600',
  },
} as const;

/**
 * Returns true if `actorRole` has at least the same permission level as `requiredRole`.
 * Useful for gating UI actions without importing the auth service.
 */
export function orgRoleAtLeast(
  actorRole: OrganizationRole,
  requiredRole: OrganizationRole,
): boolean {
  return ORG_ROLE_META[actorRole].rank >= ORG_ROLE_META[requiredRole].rank;
}

// ---------------------------------------------------------------------------
// Workspace roles
// ---------------------------------------------------------------------------

/** Stable ordered list of WorkspaceRole values — lowest to highest rank. */
export const WORKSPACE_ROLES: readonly WorkspaceRole[] = [
  'Viewer',
  'Contributor',
  'Manager',
] as const;

export interface WorkspaceRoleMeta {
  role: WorkspaceRole;
  zhLabel: string;
  enLabel: string;
  /** Numeric rank (1 = lowest, 3 = highest). */
  rank: 1 | 2 | 3;
  colorClass: string;
}

/** Metadata for each WorkspaceRole, keyed by role string. */
export const WORKSPACE_ROLE_META: Record<WorkspaceRole, WorkspaceRoleMeta> = {
  Manager: {
    role: 'Manager',
    zhLabel: '管理者',
    enLabel: 'Manager',
    rank: 3,
    colorClass: 'bg-indigo-100 text-indigo-800',
  },
  Contributor: {
    role: 'Contributor',
    zhLabel: '協作者',
    enLabel: 'Contributor',
    rank: 2,
    colorClass: 'bg-teal-100 text-teal-800',
  },
  Viewer: {
    role: 'Viewer',
    zhLabel: '檢視者',
    enLabel: 'Viewer',
    rank: 1,
    colorClass: 'bg-gray-100 text-gray-600',
  },
} as const;

/**
 * Returns true if `actorRole` has at least the same permission level as `requiredRole`.
 */
export function workspaceRoleAtLeast(
  actorRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean {
  return WORKSPACE_ROLE_META[actorRole].rank >= WORKSPACE_ROLE_META[requiredRole].rank;
}
