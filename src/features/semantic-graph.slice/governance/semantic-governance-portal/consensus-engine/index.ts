/**
 * Module: consensus-engine
 * Purpose: L8 VS8_WIKI ??Global Consensus Validation for tag governance proposals [D21-I D21-K]
 * Responsibilities: Validate RelationshipProposals for logical consistency before
 *   forwarding to L5 BBB (invariant-guard); detect contradictory/duplicate pending
 *   proposals and governance-level conflicts
 * Constraints: deterministic logic, ZERO infrastructure imports, respect module boundaries
 *
 * semantic-graph.slice/consensus-engine ???典??梯??⊿? [D21-I D21-K]
 *
 * The ConsensusEngine validates tag governance proposals for **global logical
 * consistency** before they are forwarded to the L5 Blood-Brain Barrier
 * (invariant-guard).
 *
 * Design contract:
 *   [D21-I] ?典??梯?敺???all tag governance proposals must pass consensus
 *           logic-consistency validation before reaching the BBB layer.
 *   [D21-K] 隤儔銵?鋆捱 ??proposals that would create governance-level
 *           contradictions (e.g., opposing pending proposals for the same
 *           tag pair) are rejected here, before the InvariantGuard runs.
 *
 * What is checked here (governance rules) vs. InvariantGuard (graph physics):
 *   ConsensusEngine:
 *     - Contradictory pending proposals (A IS_A B while B IS_A A both pending)
 *     - Duplicate pending proposals (same tuple already awaiting resolution)
 *     - Incomplete proposals (missing mandatory governance fields)
 *   InvariantGuard (downstream, centralized-guards/invariant-guard.ts):
 *     - Self-loops [D21-3]
 *     - Invalid weights [D21-9]
 *     - Duplicate committed edges [D21-A]
 *     - IS_A DAG cycles [D21-C D21-K]
 *
 * Dependency rule: imports from proposal-stream types ONLY.
 * ZERO infrastructure imports (no Firebase, no React, no I/O).
 *
 * 甇文祕雿歇鈭文???docs/architecture/logic-overview.md [D21-I D21-K]
 */

import type { RelationshipProposal } from '../proposal-stream';

// ??? Types ????????????????????????????????????????????????????????????????????

/** Outcome of a consensus evaluation. */
export type ConsensusDecision = 'PASS' | 'REJECTED';

/**
 * Rejection codes produced by the ConsensusEngine.
 *
 *   DUPLICATE_PENDING       ??An identical proposal (same from/to/relationType)
 *                             is already pending or approved in the queue.
 *   CONTRADICTORY_PROPOSAL  ??A logically opposing proposal exists (e.g., the
 *                             reverse direction IS_A edge is pending/approved).
 *   GOVERNANCE_CONFLICT     ??The proposal violates a tag governance rule (e.g.,
 *                             conflicting relation types between the same pair).
 *   INCOMPLETE_PROPOSAL     ??Required governance fields (proposedBy, weight)
 *                             are missing or invalid.
 */
export type ConsensusRejectionCode =
  | 'DUPLICATE_PENDING'
  | 'CONTRADICTORY_PROPOSAL'
  | 'GOVERNANCE_CONFLICT'
  | 'INCOMPLETE_PROPOSAL';

/** Result returned by {@link validateConsensus}. */
export interface ConsensusResult {
  readonly decision: ConsensusDecision;
  /** Populated only when `decision === 'REJECTED'`. */
  readonly rejectionCode?: ConsensusRejectionCode;
  /** Human-readable reason for rejection, suitable for UI feedback. */
  readonly reason?: string;
}

// ??? Helpers ??????????????????????????????????????????????????????????????????

function _isSameTuple(
  a: RelationshipProposal,
  b: RelationshipProposal,
): boolean {
  return (
    a.fromTagSlug === b.fromTagSlug &&
    a.toTagSlug === b.toTagSlug &&
    a.relationType === b.relationType
  );
}

function _isContradictoryPair(
  incoming: RelationshipProposal,
  existing: RelationshipProposal,
): boolean {
  // For IS_A edges: if A IS_A B is incoming while B IS_A A is pending, that is
  // a governance-level contradiction (reverse direction would create a cycle).
  if (incoming.relationType !== 'IS_A' || existing.relationType !== 'IS_A') {
    return false;
  }
  return (
    incoming.fromTagSlug === existing.toTagSlug &&
    incoming.toTagSlug === existing.fromTagSlug
  );
}

function _hasOpposingRelation(
  incoming: RelationshipProposal,
  existing: RelationshipProposal,
): boolean {
  // Two proposals for the same tag pair but with different relation types
  // (one IS_A, one REQUIRES) are a governance-level conflict: the semantic
  // meaning of the relationship would be ambiguous.
  return (
    incoming.fromTagSlug === existing.fromTagSlug &&
    incoming.toTagSlug === existing.toTagSlug &&
    incoming.relationType !== existing.relationType &&
    (existing.status === 'pending' || existing.status === 'approved')
  );
}

// ??? Public API ???????????????????????????????????????????????????????????????

/**
 * Validate an incoming proposal for global consensus rules [D21-I D21-K].
 *
 * @param incoming         - The new proposal to validate.
 * @param activeProposals  - All proposals currently in the queue that are
 *                          either `pending` or `approved`.
 * @returns ConsensusResult with `decision === 'PASS'` when the proposal may
 *          proceed to the L5 BBB InvariantGuard, or `decision === 'REJECTED'`
 *          with a code and human-readable reason when it violates consensus rules.
 *
 * [D21-I] All proposals must pass this check before InvariantGuard.
 * [D21-K] Opposing / contradictory proposals are rejected here.
 */
export function validateConsensus(
  incoming: RelationshipProposal,
  activeProposals: readonly RelationshipProposal[],
): ConsensusResult {
  // ?? Rule 0: Completeness check ??????????????????????????????????????????????
  if (!incoming.proposedBy || incoming.proposedBy.trim() === '') {
    return {
      decision: 'REJECTED',
      rejectionCode: 'INCOMPLETE_PROPOSAL',
      reason:
        '[D21-I] Proposal must include a non-empty proposedBy field (contributor attribution required for governance).',
    };
  }

  if (
    typeof incoming.weight !== 'number' ||
    incoming.weight <= 0 ||
    incoming.weight > 1
  ) {
    return {
      decision: 'REJECTED',
      rejectionCode: 'INCOMPLETE_PROPOSAL',
      reason: `[D21-I] Proposal weight must be in (0, 1]. Received: ${incoming.weight}.`,
    };
  }

  // ?? Rule 1: Duplicate pending check ?????????????????????????????????????????
  for (const existing of activeProposals) {
    if (existing.proposalId === incoming.proposalId) continue;
    if (
      (existing.status === 'pending' || existing.status === 'approved') &&
      _isSameTuple(incoming, existing)
    ) {
      return {
        decision: 'REJECTED',
        rejectionCode: 'DUPLICATE_PENDING',
        reason:
          `[D21-I] A ${incoming.relationType} proposal from "${incoming.fromTagSlug}" ` +
          `to "${incoming.toTagSlug}" is already ${existing.status} (${existing.proposalId}). ` +
          `Resolve or withdraw the existing proposal before submitting a new one.`,
      };
    }
  }

  // ?? Rule 2: Contradictory IS_A reversal check ????????????????????????????????
  for (const existing of activeProposals) {
    if (existing.proposalId === incoming.proposalId) continue;
    if (
      (existing.status === 'pending' || existing.status === 'approved') &&
      _isContradictoryPair(incoming, existing)
    ) {
      return {
        decision: 'REJECTED',
        rejectionCode: 'CONTRADICTORY_PROPOSAL',
        reason:
          `[D21-K] Contradictory governance proposals detected: ` +
          `"${incoming.fromTagSlug}" IS_A "${incoming.toTagSlug}" conflicts with ` +
          `existing ${existing.status} proposal "${existing.proposalId}" ` +
          `("${existing.fromTagSlug}" IS_A "${existing.toTagSlug}"). ` +
          `Resolve the contradicting proposal before proceeding.`,
      };
    }
  }

  // ?? Rule 3: Opposing relation type for the same tag pair ?????????????????????
  for (const existing of activeProposals) {
    if (existing.proposalId === incoming.proposalId) continue;
    if (_hasOpposingRelation(incoming, existing)) {
      return {
        decision: 'REJECTED',
        rejectionCode: 'GOVERNANCE_CONFLICT',
        reason:
          `[D21-K] Governance conflict: a "${existing.relationType}" proposal between ` +
          `"${existing.fromTagSlug}" and "${existing.toTagSlug}" is already ${existing.status} ` +
          `(${existing.proposalId}). A conflicting "${incoming.relationType}" proposal for the ` +
          `same tag pair cannot coexist.`,
      };
    }
  }

  return { decision: 'PASS' };
}

