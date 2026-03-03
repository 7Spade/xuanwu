/**
 * @fileoverview Tests for shared-kernel skill-tier pure functions [SK_SKILL_TIER]
 *
 * Validates that:
 *   1. getTier(xp) returns the correct tier for each XP threshold [#12]
 *   2. getTierRank returns the correct ordinal rank
 *   3. tierSatisfies correctly evaluates minimum-tier requirements [A5][P4]
 *   4. resolveSkillTier is an alias for getTier
 *   5. TIER_DEFINITIONS covers all 7 tiers
 *
 * These pure functions power the scheduling eligibility check in `_saga.ts`.
 */

import { describe, it, expect } from 'vitest';

import {
  getTier,
  getTierRank,
  tierSatisfies,
  resolveSkillTier,
  getTierDefinition,
  TIER_DEFINITIONS,
} from '@/features/shared-kernel/skill-tier';

// ---------------------------------------------------------------------------
// TIER_DEFINITIONS coverage
// ---------------------------------------------------------------------------

describe('TIER_DEFINITIONS', () => {
  it('defines exactly 7 tiers', () => {
    expect(TIER_DEFINITIONS).toHaveLength(7);
  });

  it('tiers are ordered by ascending rank (rank 1 = lowest)', () => {
    for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
      expect(TIER_DEFINITIONS[i].rank).toBe(TIER_DEFINITIONS[i - 1].rank + 1);
    }
  });

  it('XP ranges are contiguous — each tier starts where the previous ends', () => {
    for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
      expect(TIER_DEFINITIONS[i].minXp).toBe(TIER_DEFINITIONS[i - 1].maxXp);
    }
  });
});

// ---------------------------------------------------------------------------
// getTier [#12] — canonical XP → Tier mapping
// ---------------------------------------------------------------------------

describe('getTier [#12]', () => {
  it('returns "apprentice" for XP = 0', () => {
    expect(getTier(0)).toBe('apprentice');
  });

  it('returns "apprentice" for XP = 74 (boundary - 1)', () => {
    expect(getTier(74)).toBe('apprentice');
  });

  it('returns "journeyman" for XP = 75 (tier 2 lower boundary)', () => {
    expect(getTier(75)).toBe('journeyman');
  });

  it('returns "expert" for XP = 150', () => {
    expect(getTier(150)).toBe('expert');
  });

  it('returns "artisan" for XP = 225', () => {
    expect(getTier(225)).toBe('artisan');
  });

  it('returns "grandmaster" for XP = 300', () => {
    expect(getTier(300)).toBe('grandmaster');
  });

  it('returns "legendary" for XP = 375', () => {
    expect(getTier(375)).toBe('legendary');
  });

  it('returns "titan" for XP = 450 (max tier)', () => {
    expect(getTier(450)).toBe('titan');
  });

  it('returns "titan" for XP beyond max range', () => {
    expect(getTier(9999)).toBe('titan');
  });
});

// ---------------------------------------------------------------------------
// resolveSkillTier alias
// ---------------------------------------------------------------------------

describe('resolveSkillTier', () => {
  it('is an alias for getTier — same output for any XP', () => {
    expect(resolveSkillTier(0)).toBe(getTier(0));
    expect(resolveSkillTier(75)).toBe(getTier(75));
    expect(resolveSkillTier(450)).toBe(getTier(450));
  });
});

// ---------------------------------------------------------------------------
// getTierRank
// ---------------------------------------------------------------------------

describe('getTierRank', () => {
  it('returns rank 1 for "apprentice" (lowest)', () => {
    expect(getTierRank('apprentice')).toBe(1);
  });

  it('returns rank 7 for "titan" (highest)', () => {
    expect(getTierRank('titan')).toBe(7);
  });

  it('returns ranks in ascending order across all tiers', () => {
    const tiers = ['apprentice', 'journeyman', 'expert', 'artisan', 'grandmaster', 'legendary', 'titan'] as const;
    for (let i = 1; i < tiers.length; i++) {
      expect(getTierRank(tiers[i])).toBeGreaterThan(getTierRank(tiers[i - 1]));
    }
  });
});

// ---------------------------------------------------------------------------
// getTierDefinition
// ---------------------------------------------------------------------------

describe('getTierDefinition', () => {
  it('returns correct definition for "expert"', () => {
    const def = getTierDefinition('expert');
    expect(def.tier).toBe('expert');
    expect(def.rank).toBe(3);
    expect(def.minXp).toBe(150);
    expect(def.maxXp).toBe(225);
  });

  it('throws for unknown tier identifier', () => {
    expect(() => getTierDefinition('unknown' as never)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// tierSatisfies — core eligibility gate [A5][P4]
// ---------------------------------------------------------------------------

describe('tierSatisfies [A5][P4] — scheduling eligibility gate', () => {
  it('same tier satisfies itself (e.g., expert >= expert)', () => {
    expect(tierSatisfies('expert', 'expert')).toBe(true);
  });

  it('higher tier satisfies a lower minimum (artisan >= expert)', () => {
    expect(tierSatisfies('artisan', 'expert')).toBe(true);
  });

  it('lower tier does NOT satisfy a higher minimum (journeyman < expert)', () => {
    expect(tierSatisfies('journeyman', 'expert')).toBe(false);
  });

  it('"titan" satisfies any minimum tier', () => {
    const allTiers = ['apprentice', 'journeyman', 'expert', 'artisan', 'grandmaster', 'legendary', 'titan'] as const;
    for (const min of allTiers) {
      expect(tierSatisfies('titan', min)).toBe(true);
    }
  });

  it('"apprentice" only satisfies "apprentice"', () => {
    expect(tierSatisfies('apprentice', 'apprentice')).toBe(true);
    expect(tierSatisfies('apprentice', 'journeyman')).toBe(false);
  });

  it('grandmaster satisfies journeyman (construction HR scenario)', () => {
    // Real-world: an expert site manager (grandmaster) assigned to a journeyman role
    expect(tierSatisfies('grandmaster', 'journeyman')).toBe(true);
  });

  it('artisan does not satisfy grandmaster requirement', () => {
    expect(tierSatisfies('artisan', 'grandmaster')).toBe(false);
  });
});
