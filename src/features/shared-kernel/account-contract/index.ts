/**
 * shared.kernel/account-contract — SK_ACCOUNT_CONTRACT [D19]
 *
 * Cross-BC canonical types for the Account/Identity domain.
 * Per D19 (docs/logic-overview.md): cross-BC contracts belong in shared.kernel.*;
 * shared/types/account.types.ts is a legacy fallback re-export only.
 *
 * Types defined here are referenced by:
 *   – account.slice            (user profile, wallet, role)
 *   – organization.slice       (members, teams, partners)
 *   – notification-hub.slice   (Notification)
 *   – projection.bus           (account-view projector)
 *   – workspace.slice          (MemberReference, PartnerInvite)
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 * [D8] This module is pure — no async functions, no Firestore calls, no side effects.
 * [D19] Canonical definition lives here; @/shared/types/account.types re-exports for legacy consumers.
 */

import type { Timestamp } from '@/shared/ports'

import type { SkillGrant } from '../skill-tier'

// ─── Primitive domain types ───────────────────────────────────────────────────

export type AccountType = 'user' | 'organization'
export type OrganizationRole = 'Owner' | 'Admin' | 'Member' | 'Guest'
export type Presence = 'active' | 'away' | 'offline'
export type InviteState = 'pending' | 'accepted' | 'expired'
export type NotificationType = 'info' | 'alert' | 'success'

// ─── Account aggregate root ───────────────────────────────────────────────────

export interface Account {
  id: string
  name: string
  accountType: AccountType
  email?: string
  photoURL?: string
  bio?: string
  achievements?: string[]
  expertiseBadges?: ExpertiseBadge[]
  /**
   * Individual skill grants — permanently attached to this user.
   * Only meaningful on `accountType === 'user'` accounts.
   * Survives org/team deletion; matched by `tagSlug` against the global
   * static library in shared/constants/skills.ts.
   */
  skillGrants?: SkillGrant[]
  /**
   * Wallet — pre-embedded for future currency/reward system.
   * Only meaningful on `accountType === 'user'` accounts.
   * Balance is the authoritative figure; full transaction history lives in
   * the `accounts/{userId}/walletTransactions` sub-collection when needed.
   */
  wallet?: Wallet
  // org-specific
  description?: string
  ownerId?: string
  role?: OrganizationRole   // current user's role in this org
  theme?: ThemeConfig
  members?: MemberReference[]
  memberIds?: string[]
  teams?: Team[]
  createdAt?: Timestamp
}

// ─── Member and team types ────────────────────────────────────────────────────

export interface MemberReference {
  id: string
  name: string
  email: string
  role: OrganizationRole
  presence: Presence
  isExternal?: boolean
  expiryDate?: Timestamp
  /**
   * Display cache of this individual's skill grants.
   * Derived from accounts/{id}.skillGrants at read time — not the source of truth.
   * Do not write XP here; write to accounts/{userId}.skillGrants instead.
   */
  skillGrants?: SkillGrant[]
}

export interface Team {
  id: string
  name: string
  description: string
  type: 'internal' | 'external'
  memberIds: string[]
}

// ─── Organisation UI / branding ───────────────────────────────────────────────

export interface ThemeConfig {
  primary: string
  background: string
  accent: string
}

// ─── User wallet ──────────────────────────────────────────────────────────────

/**
 * User wallet — inline balance summary stored on the user account document.
 *
 * Design contract:
 *   - `balance` is always the authoritative total (never negative).
 *   - Detailed transaction history goes in `accounts/{userId}/walletTransactions`
 *     sub-collection when that feature is built — this struct stays as the
 *     fast-read summary that loads with the profile in a single document fetch.
 */
export interface Wallet {
  /** Current coin balance. Incremented by XP rewards, decremented by spending. */
  balance: number
}

// ─── Skill / expertise display ────────────────────────────────────────────────

/** @deprecated Use SkillDefinition from shared/constants/skills for new code. */
export interface ExpertiseBadge {
  id: string
  name: string
  icon?: string // e.g., a lucide-react icon name
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  timestamp: number
}

// ─── Partner invite ───────────────────────────────────────────────────────────

export interface PartnerInvite {
  id: string
  email: string
  teamId: string
  role: OrganizationRole
  inviteState: InviteState
  invitedAt: Timestamp
  protocol: string
}
