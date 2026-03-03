/**
 * @fileoverview Legacy re-export barrel — skill domain types.
 *
 * [D19] Canonical definitions live in `@/features/shared-kernel/skill-tier`.
 * This file is a backward-compat fallback; new code MUST import from `@/features/shared-kernel`.
 *
 * @deprecated Use named imports from `@/features/shared-kernel` instead:
 *   import type { SkillTier, TierDefinition, SkillRequirement, SkillTag, SkillGrant }
 *     from '@/features/shared-kernel';
 */
export type {
  SkillTier,
  TierDefinition,
  SkillRequirement,
  SkillTag,
  SkillGrant,
} from '@/features/shared-kernel/skill-tier';
