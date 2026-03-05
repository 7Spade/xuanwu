/**
 * @test VS8 Semantic Graph — SemanticGuard [D21-H D21-K D21-9 D21-3]
 *
 * Validates the Blood-Brain Barrier (BBB) at
 * centralized-guards/semantic-guard.ts.
 *
 * Scenarios covered:
 *   1. Self-loop rejection (IS_A / REQUIRES) — [D21-3]
 *   2. Invalid-weight rejection — [D21-9]
 *   3. Duplicate-edge rejection — [D21-A]
 *   4. IS_A cycle rejection — [D21-C / D21-K]
 *   5. Approval for well-formed proposals
 *
 * Architecture:
 *   [D21-H] SemanticGuard owns final veto over edge proposals.
 *   [D21-K] Proposals violating semantic logic are rejected here.
 *   [D8]    All tag logic lives in semantic-graph.slice, not shared-kernel.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { addEdge, _clearEdgesForTest } from '../centralized-edges/semantic-edge-store';

import { validateEdgeProposal } from './semantic-guard';

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _clearEdgesForTest();
});

// ═══════════════════════════════════════════════════════════════════
// Rule 1 — Self-loop rejection [D21-3]
// ═══════════════════════════════════════════════════════════════════

describe('SemanticGuard — self-loop rejection [D21-3]', () => {
  it('rejects an IS_A self-loop', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:welding',
      toTagSlug: 'skill:welding',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('SELF_LOOP');
  });

  it('rejects a REQUIRES self-loop with SELF_REQUIRES code', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'role:lead',
      toTagSlug: 'role:lead',
      relationType: 'REQUIRES',
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('SELF_REQUIRES');
  });

  it('includes a human-readable reason for self-loop rejection', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:welding',
      toTagSlug: 'skill:welding',
      relationType: 'IS_A',
    });
    expect(result.reason).toBeTruthy();
    expect(result.reason).toContain('skill:welding');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Rule 2 — Weight invariant [D21-9]
// ═══════════════════════════════════════════════════════════════════

describe('SemanticGuard — weight invariant [D21-9]', () => {
  it('rejects weight = 0', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
      weight: 0,
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('INVALID_WEIGHT');
  });

  it('rejects negative weight', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
      weight: -0.5,
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('INVALID_WEIGHT');
  });

  it('rejects weight > 1', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
      weight: 1.01,
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('INVALID_WEIGHT');
  });

  it('approves weight = 1.0 (upper bound is inclusive)', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
      weight: 1.0,
    });
    expect(result.decision).toBe('APPROVED');
  });

  it('approves a small positive weight close to zero', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
      weight: 0.001,
    });
    expect(result.decision).toBe('APPROVED');
  });

  it('defaults missing weight to 1.0 and approves', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('APPROVED');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Rule 3 — Duplicate edge rejection [D21-A]
// ═══════════════════════════════════════════════════════════════════

describe('SemanticGuard — duplicate edge rejection [D21-A]', () => {
  it('rejects a proposal that duplicates an existing edge', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('DUPLICATE_EDGE');
  });

  it('does NOT reject when same pair exists only with a different relationType', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'REQUIRES',
    });
    expect(result.decision).toBe('APPROVED');
  });

  it('does NOT reject a reverse-direction edge (IS_A is directional)', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'skill:senior',
      toTagSlug: 'skill:expert',
      relationType: 'IS_A',
    });
    // This will pass the duplicate check but fail the cycle check;
    // what matters here is the rejectionCode is NOT DUPLICATE_EDGE.
    expect(result.rejectionCode).not.toBe('DUPLICATE_EDGE');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Rule 4 — IS_A cycle detection [D21-C / D21-K]
// ═══════════════════════════════════════════════════════════════════

describe('SemanticGuard — IS_A cycle detection [D21-C D21-K]', () => {
  it('rejects a direct two-node cycle (A IS_A B, then B IS_A A)', () => {
    addEdge('skill:expert', 'skill:senior', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'skill:senior',
      toTagSlug: 'skill:expert',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('IS_A_CYCLE');
  });

  it('rejects a three-node transitive cycle (A→B→C, then C→A)', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'c',
      toTagSlug: 'a',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('REJECTED');
    expect(result.rejectionCode).toBe('IS_A_CYCLE');
  });

  it('does NOT apply cycle detection to REQUIRES edges', () => {
    addEdge('skill:expert', 'skill:senior', 'REQUIRES');

    // The reverse REQUIRES edge should not be blocked by the IS_A cycle check
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:senior',
      toTagSlug: 'skill:expert',
      relationType: 'REQUIRES',
    });
    // Only the duplicate check or weight check might trigger; IS_A_CYCLE must not
    expect(result.rejectionCode).not.toBe('IS_A_CYCLE');
  });

  it('approves a diamond-shaped IS_A graph (A→C, B→C) — no cycle', () => {
    addEdge('a', 'c', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'b',
      toTagSlug: 'c',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('APPROVED');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Rule 5 — Approval for well-formed proposals
// ═══════════════════════════════════════════════════════════════════

describe('SemanticGuard — approves valid proposals', () => {
  it('approves the first edge in an empty graph', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:expert',
      toTagSlug: 'skill:senior',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('APPROVED');
    expect(result.rejectionCode).toBeUndefined();
    expect(result.reason).toBeUndefined();
  });

  it('approves a REQUIRES edge between different node pairs', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'role:lead',
      toTagSlug: 'skill:expert',
      relationType: 'REQUIRES',
      weight: 0.8,
    });
    expect(result.decision).toBe('APPROVED');
  });

  it('approves a low-weight IS_A edge', () => {
    const result = validateEdgeProposal({
      fromTagSlug: 'skill:junior',
      toTagSlug: 'skill:mid',
      relationType: 'IS_A',
      weight: 0.5,
    });
    expect(result.decision).toBe('APPROVED');
  });

  it('approves extending a linear IS_A chain without cycling', () => {
    addEdge('a', 'b', 'IS_A');
    addEdge('b', 'c', 'IS_A');

    const result = validateEdgeProposal({
      fromTagSlug: 'c',
      toTagSlug: 'd',
      relationType: 'IS_A',
    });
    expect(result.decision).toBe('APPROVED');
  });
});
