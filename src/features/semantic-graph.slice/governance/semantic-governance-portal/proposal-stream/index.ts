/**
 * Module: semantic-graph.slice/proposal-stream ??[L8 VS8_WIKI] Proposal Stream
 *
 * Asynchronous proposal review pipeline for tag relationship governance [D21-I~W].
 *
 * Responsibilities:
 *   - Receive proposals from wiki-editor/.
 *   - Persist proposals as pending items in the proposal queue.
 *   - Drive the consensus-validation lifecycle (pending ??approved / rejected).
 *   - Approved proposals are forwarded to L5 BBB (centralized-guards/) before
 *     being committed to L2 (centralized-edges/).
 *
 * @see docs/architecture/slices/semantic-graph.md ??L8 VS8_WIKI
 */

import type { TagSlugRef } from '@/shared-kernel';

import type { SemanticRelationType } from '../../../core/types';

// ??? Types ????????????????????????????????????????????????????????????????????

/** Opaque proposal identifier. */
export type ProposalId = string & { readonly _brand: 'ProposalId' };

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface RelationshipProposal {
  readonly proposalId: ProposalId;
  readonly fromTagSlug: TagSlugRef;
  readonly toTagSlug: TagSlugRef;
  readonly relationType: SemanticRelationType;
  /** Proposed edge weight in (0, 1]. */
  readonly weight: number;
  readonly proposedBy: string;
  readonly proposedAt: string;
  status: ProposalStatus;
  rejectionReason?: string;
  resolvedAt?: string;
}

// ??? Internal queue ???????????????????????????????????????????????????????????

const _proposals = new Map<string, RelationshipProposal>();
let _seq = 0;

function _newId(): ProposalId {
  return `proposal-${Date.now()}-${++_seq}` as ProposalId;
}

// ??? Public API ???????????????????????????????????????????????????????????????

/**
 * Persist a new relationship proposal in the pending queue.
 * Returns the assigned ProposalId.
 */
export function enqueueProposal(
  proposal: Omit<RelationshipProposal, 'proposalId' | 'status'>,
): ProposalId {
  const id = _newId();
  _proposals.set(id, { ...proposal, proposalId: id, status: 'pending' });
  return id;
}

/**
 * Approve a pending proposal.
 * The caller (L5 BBB guard) is responsible for committing the edge to L2.
 */
export function approveProposal(proposalId: ProposalId): void {
  const p = _proposals.get(proposalId);
  if (!p) throw new Error(`[VS8_WIKI] Unknown proposal: ${proposalId}`);
  if (p.status !== 'pending') throw new Error(`[VS8_WIKI] Proposal ${proposalId} is not pending`);
  p.status = 'approved';
  p.resolvedAt = new Date().toISOString();
}

/**
 * Reject a pending proposal with a reason.
 */
export function rejectProposal(proposalId: ProposalId, reason: string): void {
  const p = _proposals.get(proposalId);
  if (!p) throw new Error(`[VS8_WIKI] Unknown proposal: ${proposalId}`);
  if (p.status !== 'pending') throw new Error(`[VS8_WIKI] Proposal ${proposalId} is not pending`);
  p.status = 'rejected';
  p.rejectionReason = reason;
  p.resolvedAt = new Date().toISOString();
}

/**
 * Return all proposals currently in the pending state.
 */
export function listPendingProposals(): readonly RelationshipProposal[] {
  return Array.from(_proposals.values()).filter((p) => p.status === 'pending');
}

/** Return all proposals regardless of status. */
export function listAllProposals(): readonly RelationshipProposal[] {
  return Array.from(_proposals.values());
}

/** Clear all proposals (used in tests). */
export function _clearProposalsForTest(): void {
  _proposals.clear();
  _seq = 0;
}

