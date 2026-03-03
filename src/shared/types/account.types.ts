/**
 * @fileoverview Legacy re-export barrel — account domain types.
 *
 * [D19] Canonical definitions live in `@/features/shared-kernel/account-contract`.
 * This file is a backward-compat fallback; new code MUST import from `@/features/shared-kernel`.
 *
 * @deprecated Use named imports from `@/features/shared-kernel` instead:
 *   import type { Account, MemberReference, OrganizationRole, PartnerInvite, Team, ... }
 *     from '@/features/shared-kernel';
 */
export type {
  AccountType,
  OrganizationRole,
  Presence,
  InviteState,
  NotificationType,
  Account,
  MemberReference,
  Team,
  ThemeConfig,
  Wallet,
  ExpertiseBadge,
  Notification,
  PartnerInvite,
} from '@/features/shared-kernel/account-contract';
