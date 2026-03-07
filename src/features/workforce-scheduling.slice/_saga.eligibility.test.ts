/**
 * @fileoverview Tests for Scheduling Saga eligibility-check logic [A5][VS6]
 *
 * Validates the skill-matching algorithm used in `startSchedulingSaga` by testing
 * the `tierSatisfies` + candidate-selection logic in isolation (no Firestore).
 *
 * Tests cover:
 *   1. Candidate selection when skills match exactly
 *   2. Candidate selection when member has higher tier (should pass)
 *   3. Rejection when no member meets skill requirements
 *   4. Empty requirements ??any eligible member is a candidate
 *   5. Multiple requirements ??all must be satisfied (AND logic)
 *   6. WorkspaceScheduleProposedPayload carries skillRequirements correctly [A4?A5]
 */

import { describe, it, expect } from 'vitest';

import type { SkillTier, SkillRequirement, WorkspaceScheduleProposedPayload } from '@/shared-kernel';
import { tierSatisfies, tagSlugRef } from '@/shared-kernel';

// ---------------------------------------------------------------------------
// Helpers ??mirrors the eligibility logic inside _saga.ts
// ---------------------------------------------------------------------------

/** Subset of the org eligible-member-view projection used by the saga. */
interface MockMember {
  accountId: string;
  eligible: boolean;
  skills: { skillId: string; tier: SkillTier }[];
}

/**
 * Replicates the candidate-selection logic from `startSchedulingSaga`.
 * Tests this pure logic without Firestore dependencies.
 */
function selectCandidate(
  members: MockMember[],
  requirements: SkillRequirement[]
): MockMember | undefined {
  return members.find((member) => {
    if (!member.eligible) return false;
    return requirements.every((req) => {
      const skill = member.skills.find((s) => s.skillId === req.tagSlug);
      if (!skill) return false;
      return tierSatisfies(skill.tier, req.minimumTier);
    });
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EXPERT_MEMBER: MockMember = {
  accountId: 'member-001',
  eligible: true,
  skills: [
    { skillId: 'civil-structural', tier: 'expert' },
    { skillId: 'site-management', tier: 'journeyman' },
  ],
};

const APPRENTICE_MEMBER: MockMember = {
  accountId: 'member-002',
  eligible: true,
  skills: [
    { skillId: 'civil-structural', tier: 'apprentice' },
  ],
};

const INELIGIBLE_MEMBER: MockMember = {
  accountId: 'member-003',
  eligible: false,
  skills: [
    { skillId: 'civil-structural', tier: 'titan' },
  ],
};

const GRANDMASTER_MEMBER: MockMember = {
  accountId: 'member-004',
  eligible: true,
  skills: [
    { skillId: 'civil-structural', tier: 'grandmaster' },
    { skillId: 'bim', tier: 'artisan' },
  ],
};

// ---------------------------------------------------------------------------
// Candidate selection
// ---------------------------------------------------------------------------

describe('Saga eligibility candidate selection [A5]', () => {
  it('selects a member whose tier exactly meets the minimum', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
    ];
    const candidate = selectCandidate([EXPERT_MEMBER], reqs);
    expect(candidate?.accountId).toBe('member-001');
  });

  it('selects a member with higher tier than minimum (grandmaster >= expert)', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
    ];
    const candidate = selectCandidate([GRANDMASTER_MEMBER], reqs);
    expect(candidate?.accountId).toBe('member-004');
  });

  it('returns undefined when no member meets skill requirements', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
    ];
    const candidate = selectCandidate([APPRENTICE_MEMBER], reqs);
    expect(candidate).toBeUndefined();
  });

  it('skips ineligible members even if their skills qualify', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'apprentice', quantity: 1 },
    ];
    const candidate = selectCandidate([INELIGIBLE_MEMBER], reqs);
    expect(candidate).toBeUndefined();
  });

  it('returns first eligible candidate from a list', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
    ];
    const candidate = selectCandidate(
      [APPRENTICE_MEMBER, EXPERT_MEMBER, GRANDMASTER_MEMBER],
      reqs
    );
    // EXPERT_MEMBER is the first eligible one (APPRENTICE_MEMBER is filtered out)
    expect(candidate?.accountId).toBe('member-001');
  });

  it('selects any eligible member when requirements is empty (no skill filter)', () => {
    const candidate = selectCandidate(
      [EXPERT_MEMBER, APPRENTICE_MEMBER],
      [] // empty requirements
    );
    expect(candidate?.accountId).toBe('member-001');
  });

  it('returns undefined when member pool is empty', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
    ];
    const candidate = selectCandidate([], reqs);
    expect(candidate).toBeUndefined();
  });

  it('AND logic ??all requirements must be satisfied simultaneously', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
      { tagSlug: tagSlugRef('bim'), minimumTier: 'artisan', quantity: 1 },
    ];
    // EXPERT_MEMBER: civil-structural=expert ?? but has no bim skill ??
    expect(selectCandidate([EXPERT_MEMBER], reqs)).toBeUndefined();

    // GRANDMASTER_MEMBER: civil-structural=grandmaster ?? bim=artisan ??
    expect(selectCandidate([GRANDMASTER_MEMBER], reqs)?.accountId).toBe('member-004');
  });

  it('member without a required skill is rejected even if other skills qualify', () => {
    const reqs: SkillRequirement[] = [
      { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'expert', quantity: 1 },
      { tagSlug: tagSlugRef('landscape'), minimumTier: 'journeyman', quantity: 1 },
    ];
    // EXPERT_MEMBER has civil-structural but not landscape
    expect(selectCandidate([EXPERT_MEMBER], reqs)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// WorkspaceScheduleProposedPayload contract [A4 ? A5]
// ---------------------------------------------------------------------------

describe('WorkspaceScheduleProposedPayload contract [A4?A5]', () => {
  it('accepts skillRequirements propagated from ParsingIntent [TE_SK ??A5]', () => {
    const payload: WorkspaceScheduleProposedPayload = {
      scheduleItemId: 'sched-001',
      workspaceId: 'ws-abc',
      orgId: 'org-xyz',
      title: '?箇???撌亦?',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      proposedBy: 'account-001',
      intentId: 'intent-001',
      skillRequirements: [
        { tagSlug: tagSlugRef('civil-structural'), minimumTier: 'journeyman', quantity: 2 },
      ],
      traceId: 'trace-abc-123',
    };

    expect(payload.skillRequirements).toHaveLength(1);
    expect(payload.skillRequirements![0].tagSlug).toBe('civil-structural');
    expect(payload.skillRequirements![0].minimumTier).toBe('journeyman');
    expect(payload.skillRequirements![0].quantity).toBe(2);
    expect(payload.intentId).toBe('intent-001');
    expect(payload.traceId).toBe('trace-abc-123');
  });

  it('works without optional fields (backward compatibility)', () => {
    const payload: WorkspaceScheduleProposedPayload = {
      scheduleItemId: 'sched-002',
      workspaceId: 'ws-abc',
      orgId: 'org-xyz',
      title: '瘞湧?恣撌亦?',
      startDate: '2026-05-01',
      endDate: '2026-05-15',
      proposedBy: 'account-002',
    };

    expect(payload.skillRequirements).toBeUndefined();
    expect(payload.intentId).toBeUndefined();
    expect(payload.traceId).toBeUndefined();
  });
});
