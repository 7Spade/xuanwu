/**
 * Module: account-contract.ts
 * Purpose: define canonical cross-BC account-related data contracts
 * Responsibilities: provide account, membership, notification, and role contract types
 * Constraints: deterministic logic, respect module boundaries
 */

import type { Timestamp } from '@/shared-kernel/ports/i-firestore.repo';

import type { SkillGrant } from './skill-grant-contract';

export type AccountType = 'user' | 'organization';
export type OrganizationRole = 'Owner' | 'Admin' | 'Member' | 'Guest';
export type Presence = 'active' | 'away' | 'offline';
export type InviteState = 'pending' | 'accepted' | 'expired';
export type NotificationType = 'info' | 'alert' | 'success';

export interface ThemeConfig {
  primary: string;
  background: string;
  accent: string;
}

export interface Wallet {
  balance: number;
}

export interface ExpertiseBadge {
  id: string;
  name: string;
  icon?: string;
}

export interface MemberReference {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  presence: Presence;
  isExternal?: boolean;
  expiryDate?: Timestamp;
  skillGrants?: SkillGrant[];
}

export interface Team {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'external';
  memberIds: string[];
}

export interface PartnerInvite {
  id: string;
  email: string;
  teamId: string;
  role: OrganizationRole;
  inviteState: InviteState;
  invitedAt: Timestamp;
  protocol: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: number;
}

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  email?: string;
  photoURL?: string;
  bio?: string;
  achievements?: string[];
  expertiseBadges?: ExpertiseBadge[];
  skillGrants?: SkillGrant[];
  wallet?: Wallet;
  description?: string;
  ownerId?: string;
  role?: OrganizationRole;
  theme?: ThemeConfig;
  members?: MemberReference[];
  memberIds?: string[];
  teams?: Team[];
  createdAt?: Timestamp;
}
