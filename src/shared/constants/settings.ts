/**
 * @fileoverview shared/constants/settings.ts — App-wide configuration defaults.
 *
 * Single source of truth for numeric limits, defaults, and feature flags used
 * across the application.  Update values here instead of scattering magic numbers
 * throughout feature slices.
 *
 * Rules:
 *   - No Firebase / React imports.
 *   - All values must be `as const` (no mutable state).
 *   - Group related constants in namespaced objects.
 */

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const PAGINATION = {
  /** Default page size for list views (audit logs, members, schedule items…). */
  DEFAULT_PAGE_SIZE: 20,
  /** Compact page size used in sidebar / summary panels. */
  COMPACT_PAGE_SIZE: 10,
  /** Maximum page size accepted by query helpers (prevents unbounded reads). */
  MAX_PAGE_SIZE: 100,
} as const;

// ---------------------------------------------------------------------------
// Skill XP system
// ---------------------------------------------------------------------------

/**
 * XP bounds — duplicated here for components that must not import from feature slices.
 * The canonical computation function (getTier / resolveSkillTier) remains in
 * `@/features/shared-kernel/skill-tier` per the dependency direction rule.
 */
export const SKILL_XP = {
  MIN: 0,
  /** Maximum achievable XP (Titan tier ceiling). */
  MAX: 525,
  /** XP awarded per completed task (default, may be overridden per-org). */
  DEFAULT_REWARD: 10,
  /** XP deducted for a failed quality check (default). */
  DEFAULT_PENALTY: 5,
} as const;

// ---------------------------------------------------------------------------
// File uploads
// ---------------------------------------------------------------------------

export const FILE_UPLOAD = {
  /** Maximum single-file size in bytes (10 MB). */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  /** Human-readable limit label for error messages. */
  MAX_SIZE_LABEL: '10 MB',
  /** Accepted MIME types for document parser intake. */
  DOCUMENT_ACCEPT: '.pdf,.png,.jpg,.jpeg',
  /** Maximum number of files per upload batch. */
  MAX_BATCH_FILES: 5,
} as const;

// ---------------------------------------------------------------------------
// Schedule / shift rules
// ---------------------------------------------------------------------------

export const SCHEDULE = {
  /** Minimum shift duration in minutes. */
  MIN_SHIFT_MINUTES: 30,
  /** Maximum shift duration in hours. */
  MAX_SHIFT_HOURS: 24,
  /** Maximum number of required skills per schedule item. */
  MAX_REQUIRED_SKILLS: 10,
  /** Maximum assignees per schedule item. */
  MAX_ASSIGNEES: 50,
} as const;

// ---------------------------------------------------------------------------
// Workspace governance
// ---------------------------------------------------------------------------

export const WORKSPACE = {
  /** Maximum number of sub-locations per workspace (FR-L1). */
  MAX_LOCATIONS: 50,
  /** Maximum number of tasks that can be bulk-imported in one operation. */
  MAX_BULK_IMPORT_TASKS: 200,
  /** Default protocol template shown when creating a new workspace. */
  DEFAULT_PROTOCOL: 'standard-v1',
} as const;

// ---------------------------------------------------------------------------
// Organisation membership
// ---------------------------------------------------------------------------

export const ORGANISATION = {
  /** Maximum number of members per organisation. */
  MAX_MEMBERS: 500,
  /** Maximum number of teams per organisation. */
  MAX_TEAMS: 50,
  /** Default partner invite expiry in days. */
  INVITE_EXPIRY_DAYS: 7,
} as const;

// ---------------------------------------------------------------------------
// UI / UX
// ---------------------------------------------------------------------------

export const UI = {
  /** Debounce delay in ms for search inputs. */
  SEARCH_DEBOUNCE_MS: 300,
  /** Toast notification auto-dismiss duration in ms. */
  TOAST_DURATION_MS: 4000,
  /** Skeleton loading placeholder count for list views. */
  SKELETON_COUNT: 6,
} as const;

// ---------------------------------------------------------------------------
// Application metadata
// ---------------------------------------------------------------------------

export const APP = {
  /** Application name shown in page titles and emails. */
  NAME: '玄武工程協作平台',
  /** Short English name used in metadata and alt text. */
  NAME_EN: 'Xuanwu',
  /** Support email address. */
  SUPPORT_EMAIL: 'support@xuanwu.app',
} as const;
