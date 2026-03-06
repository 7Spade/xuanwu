/**
 * Module: skill-grant-contract.ts
 * Purpose: define cross-BC skill grant value contracts
 * Responsibilities: provide portable skill identity and granted proficiency structures
 * Constraints: deterministic logic, respect module boundaries
 */

import type { Timestamp } from '@/shared-kernel/ports/i-firestore.repo';

import type { SkillTier } from '../skill-tier';
import type { TagSlugRef } from '../tag-authority';

export interface SkillTag {
  slug: string;
  name: string;
  category?: string;
  description?: string;
}

export interface SkillGrant {
  tagSlug: TagSlugRef;
  tagName?: string;
  tagId?: string;
  tier: SkillTier;
  xp: number;
  earnedInOrgId?: string;
  grantedAt?: Timestamp;
}
