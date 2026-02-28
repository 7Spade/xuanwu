/**
 * @fileoverview shared/constants/routes.ts — Application route path constants.
 * Use these instead of hardcoding path strings in components.
 */

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  WORKSPACES: "/workspaces",
  WORKSPACES_NEW: "/workspaces/new",
  WORKSPACE: (id: string) => `/workspaces/${id}` as const,
  WORKSPACE_LOCATIONS: (id: string) => `/workspaces/${id}/locations` as const,
  ACCOUNT_NEW: "/dashboard/account/new",
  ACCOUNT_MEMBERS: "/dashboard/account/members",
  ACCOUNT_TEAMS: "/dashboard/account/teams",
  ACCOUNT_PARTNERS: "/dashboard/account/partners",
  ACCOUNT_SETTINGS: "/dashboard/account/settings",
  ACCOUNT_MATRIX: "/dashboard/account/matrix",
  ACCOUNT_SCHEDULE: "/dashboard/account/schedule",
  ACCOUNT_ORG_SCHEDULE: "/dashboard/account/schedule",
  ACCOUNT_DEMAND_BOARD: "/dashboard/account/schedule",
  ACCOUNT_DAILY: "/dashboard/account/daily",
  ACCOUNT_AUDIT: "/dashboard/account/audit",
  /** FR-K1: Personal skill profile page (XP + tier visualization). */
  ACCOUNT_SKILLS: "/dashboard/account/skills",
} as const;
