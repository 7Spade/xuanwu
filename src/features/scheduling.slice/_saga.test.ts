/**
 * @test [A5] Scheduling Saga — eligibility matching logic
 *
 * Validates the pure eligibility-matching logic used by `startSchedulingSaga`
 * to find the best candidate, imported directly from `_eligibility.ts`.
 *
 * [A5] Compensation: if no candidate matches all skill requirements, saga
 *      transitions to 'compensated' state.
 * [P4] Eligibility check: member.eligible must be true AND all skill requirements
 *      must be satisfied by the member's skill tiers.
 * [TE_SK] skill-requirement = tagSlug × minimumTier — cross-BC staffing contract.
 */
import { describe, it, expect } from 'vitest';

import type { OrgEligibleMemberView } from '@/features/projection.bus';
import type { SkillRequirement } from '@/features/shared-kernel';
import { tierSatisfies, TIER_DEFINITIONS } from '@/features/shared-kernel/skill-tier';

import {
  SAGA_TIER_ORDER,
  sagaTierIndex,
  findEligibleCandidate,
  findEligibleCandidatesForRequirements,
} from './_eligibility';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('[A5] Scheduling Saga — eligibility matching [P4][TE_SK]', () => {
  describe('sagaTierIndex helper', () => {
    it('returns 0 for apprentice (lowest)', () => {
      expect(sagaTierIndex('apprentice')).toBe(0);
    });

    it('returns 6 for titan (highest)', () => {
      expect(sagaTierIndex('titan')).toBe(6);
    });

    it('returns 0 for unknown tier (safe default)', () => {
      expect(sagaTierIndex('unknown')).toBe(0);
    });

    it('returns strictly increasing indices for each tier', () => {
      for (let i = 1; i < SAGA_TIER_ORDER.length; i++) {
        expect(sagaTierIndex(SAGA_TIER_ORDER[i])).toBeGreaterThan(sagaTierIndex(SAGA_TIER_ORDER[i - 1]));
      }
    });

    it('each tier index matches its position in SAGA_TIER_ORDER', () => {
      SAGA_TIER_ORDER.forEach((tier, idx) => {
        expect(sagaTierIndex(tier)).toBe(idx);
      });
    });
  });

  describe('findEligibleCandidate — [P4] eligibility gate', () => {
    function makeMember(
      accountId: string,
      eligible: boolean,
      skills: Array<{ skillId: string; tier: string }>
    ): OrgEligibleMemberView {
      return {
        orgId: 'org-test',
        accountId,
        eligible,
        skills: skills.map(({ skillId, tier }) => ({
          skillId,
          xp: 0,
          tier: tier as OrgEligibleMemberView['skills'][number]['tier'],
        })),
      };
    }

    const expertMember = makeMember('member-1', true, [
      { skillId: 'civil-structural:concrete', tier: 'expert' },
      { skillId: 'site-management:safety', tier: 'journeyman' },
    ]);
    const apprenticeMember = makeMember('member-2', true, [
      { skillId: 'civil-structural:concrete', tier: 'apprentice' },
    ]);
    const ineligibleMember = makeMember('member-3', false, [
      { skillId: 'civil-structural:concrete', tier: 'titan' },
    ]);

    it('returns first eligible member when requirements are empty', () => {
      const result = findEligibleCandidate([expertMember, apprenticeMember], []);
      expect(result?.accountId).toBe('member-1');
    });

    it('skips ineligible members regardless of skill tier', () => {
      const result = findEligibleCandidate([ineligibleMember, expertMember], []);
      expect(result?.accountId).toBe('member-1');
    });

    it('matches member with exact tier requirement', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 }];
      expect(findEligibleCandidate([expertMember], reqs)?.accountId).toBe('member-1');
    });

    it('matches member with higher tier than required', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'journeyman', quantity: 1 }];
      expect(findEligibleCandidate([expertMember], reqs)?.accountId).toBe('member-1');
    });

    it('rejects member whose tier is below minimum [P4]', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 }];
      expect(findEligibleCandidate([apprenticeMember], reqs)).toBeUndefined();
    });

    it('rejects member missing a required skill entirely', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'bim:revit', minimumTier: 'journeyman', quantity: 1 }];
      expect(findEligibleCandidate([expertMember, apprenticeMember], reqs)).toBeUndefined();
    });

    it('evaluates ALL requirements (conjunction) [TE_SK]', () => {
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
        { tagSlug: 'site-management:safety', minimumTier: 'expert', quantity: 1 }, // expertMember only has journeyman here
      ];
      expect(findEligibleCandidate([expertMember], reqs)).toBeUndefined();
    });

    it('selects first matching member in list order (deterministic)', () => {
      const titanMember = makeMember('member-titan', true, [
        { skillId: 'civil-structural:concrete', tier: 'titan' },
      ]);
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'journeyman', quantity: 1 }];
      expect(findEligibleCandidate([titanMember, expertMember], reqs)?.accountId).toBe('member-titan');
    });

    it('[A5] returns undefined when no member satisfies requirements → triggers compensation', () => {
      const result = findEligibleCandidate([ineligibleMember], [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
      ]);
      expect(result).toBeUndefined();
    });
  });

  describe('sagaTierIndex consistency with tierSatisfies', () => {
    it('sagaTierIndex and tierSatisfies agree on ordering for all tier pairs', () => {
      const tiers = SAGA_TIER_ORDER;
      for (let i = 0; i < tiers.length; i++) {
        for (let j = 0; j < tiers.length; j++) {
          const satisfies = tierSatisfies(tiers[i], tiers[j]);
          const byIndex = sagaTierIndex(tiers[i]) >= sagaTierIndex(tiers[j]);
          expect(satisfies).toBe(byIndex);
        }
      }
    });

    it('SAGA_TIER_ORDER matches the rank order in shared-kernel TIER_DEFINITIONS', () => {
      // Ensure the saga's tier ordering never silently diverges from the canonical
      // TIER_DEFINITIONS defined in shared-kernel. If TIER_DEFINITIONS adds, removes,
      // or reorders a tier, this test will catch the mismatch.
      const canonicalOrder = TIER_DEFINITIONS.map((d) => d.tier);
      expect(SAGA_TIER_ORDER).toEqual(canonicalOrder);
    });
  });
});

// ─── findEligibleCandidatesForRequirements — multi-member assignment ──────────

describe('[A5] findEligibleCandidatesForRequirements — multi-member [quantity][TE_SK]', () => {
  function makeMember(
    accountId: string,
    eligible: boolean,
    skills: Array<{ skillId: string; tier: string }>
  ): OrgEligibleMemberView {
    return {
      orgId: 'org-test',
      accountId,
      eligible,
      skills: skills.map(({ skillId, tier }) => ({
        skillId,
        xp: 0,
        tier: tier as OrgEligibleMemberView['skills'][number]['tier'],
      })),
    };
  }

  const memberA = makeMember('member-A', true, [{ skillId: 'civil-structural:concrete', tier: 'expert' }]);
  const memberB = makeMember('member-B', true, [{ skillId: 'civil-structural:concrete', tier: 'journeyman' }]);
  const memberC = makeMember('member-C', true, [{ skillId: 'bim:revit', tier: 'artisan' }]);
  const memberD = makeMember('member-D', true, [{ skillId: 'civil-structural:concrete', tier: 'expert' }, { skillId: 'bim:revit', tier: 'artisan' }]);
  const ineligibleMember = makeMember('member-X', false, [{ skillId: 'civil-structural:concrete', tier: 'titan' }]);

  describe('empty requirements (backward-compatible single assignment)', () => {
    it('returns one eligible member when requirements is empty', () => {
      const result = findEligibleCandidatesForRequirements([memberA, memberB], []);
      expect(result).toHaveLength(1);
      expect(result![0].candidate.accountId).toBe('member-A');
      expect(result![0].requirement).toBeNull();
    });

    it('returns undefined when no eligible members and requirements is empty', () => {
      expect(findEligibleCandidatesForRequirements([ineligibleMember], [])).toBeUndefined();
    });
  });

  describe('quantity > 1 — multiple members for same skill', () => {
    it('assigns 2 distinct members for quantity: 2', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'journeyman', quantity: 2 }];
      const result = findEligibleCandidatesForRequirements([memberA, memberB], reqs);
      expect(result).toHaveLength(2);
      const ids = result!.map((a) => a.candidate.accountId);
      expect(ids).toContain('member-A');
      expect(ids).toContain('member-B');
    });

    it('compensates when pool has fewer members than quantity requires', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 2 }];
      // Only memberA and memberD qualify (expert+); memberB is journeyman → below expert
      const result = findEligibleCandidatesForRequirements([memberA, memberB], reqs);
      expect(result).toBeUndefined();
    });

    it('no member is assigned twice even if they satisfy quantity', () => {
      // Only one eligible member — cannot satisfy quantity: 2
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'journeyman', quantity: 2 }];
      expect(findEligibleCandidatesForRequirements([memberA], reqs)).toBeUndefined();
    });
  });

  describe('multiple skill requirements — one member per skill type', () => {
    it('assigns one member per distinct skill requirement', () => {
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
        { tagSlug: 'bim:revit', minimumTier: 'artisan', quantity: 1 },
      ];
      // memberA covers civil; memberC covers bim
      const result = findEligibleCandidatesForRequirements([memberA, memberC], reqs);
      expect(result).toHaveLength(2);
      const ids = result!.map((a) => a.candidate.accountId);
      expect(ids).toContain('member-A');
      expect(ids).toContain('member-C');
    });

    it('member with both skills fills first matching requirement; second is filled by another member', () => {
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
        { tagSlug: 'bim:revit', minimumTier: 'artisan', quantity: 1 },
      ];
      // memberD has both skills — but is only assigned once (first requirement)
      // memberC covers the second requirement
      const result = findEligibleCandidatesForRequirements([memberD, memberC], reqs);
      expect(result).toHaveLength(2);
      // memberD assigned to civil-structural (first req), memberC to bim
      expect(result![0].candidate.accountId).toBe('member-D');
      expect(result![1].candidate.accountId).toBe('member-C');
    });

    it('compensates when one skill requirement cannot be satisfied', () => {
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
        { tagSlug: 'landscape:design', minimumTier: 'journeyman', quantity: 1 }, // no member has this
      ];
      expect(findEligibleCandidatesForRequirements([memberA, memberC], reqs)).toBeUndefined();
    });

    it('compensates when second requirement exhausts the eligible pool after first is filled', () => {
      // memberD could cover both civil and bim individually, but once assigned for civil it is gone
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
        { tagSlug: 'bim:revit', minimumTier: 'artisan', quantity: 1 },
      ];
      // Only memberD available (no separate memberC)
      expect(findEligibleCandidatesForRequirements([memberD], reqs)).toBeUndefined();
    });
  });

  describe('mixed quantity and multiple skill requirements', () => {
    it('assigns 2 civil engineers AND 1 BIM specialist from a pool of 3', () => {
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'journeyman', quantity: 2 },
        { tagSlug: 'bim:revit', minimumTier: 'artisan', quantity: 1 },
      ];
      // memberA: civil expert, memberB: civil journeyman, memberC: bim artisan
      const result = findEligibleCandidatesForRequirements([memberA, memberB, memberC], reqs);
      expect(result).toHaveLength(3);
      const ids = result!.map((a) => a.candidate.accountId);
      expect(ids).toContain('member-A');
      expect(ids).toContain('member-B');
      expect(ids).toContain('member-C');
    });

    it('each assignment carries its specific requirement for downstream validation', () => {
      const reqs: SkillRequirement[] = [
        { tagSlug: 'civil-structural:concrete', minimumTier: 'expert', quantity: 1 },
        { tagSlug: 'bim:revit', minimumTier: 'artisan', quantity: 1 },
      ];
      const result = findEligibleCandidatesForRequirements([memberA, memberC], reqs);
      expect(result![0].requirement?.tagSlug).toBe('civil-structural:concrete');
      expect(result![1].requirement?.tagSlug).toBe('bim:revit');
    });

    it('ineligible members are always skipped regardless of skill tier', () => {
      const reqs: SkillRequirement[] = [{ tagSlug: 'civil-structural:concrete', minimumTier: 'apprentice', quantity: 1 }];
      expect(findEligibleCandidatesForRequirements([ineligibleMember], reqs)).toBeUndefined();
    });
  });
});
