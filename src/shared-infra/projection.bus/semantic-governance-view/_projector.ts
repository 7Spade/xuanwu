/**
 * projection.semantic-governance-view — _projector.ts
 *
 * Maintains the semantic governance page read model.
 * Covers wiki entries, proposals, and tag relationship data surfaced by VS8
 * for the governance UI.
 *
 * Per 00-LogicOverview.md (VS8 → STD_PROJ_LANE):
 *   SEM_GOV_V["projection.semantic-governance-view\n治理頁 Read Model（wiki/proposal/relationship）\n顯示線路：L5→L6→UI"]
 *   QGWAY_SEM_GOV["→ .semantic-governance-view\n語義治理頁讀模型（提案/共識/關係）\n治理頁顯示必經 L5 投影"]
 *
 * Stored at: semanticGovernanceView/tags/{tagSlug}
 *
 * [S2] SK_VERSION_GUARD: versionGuardAllows enforced before every write.
 * [R8] traceId from the originating EventEnvelope is propagated into the record.
 * [A6] CENTRALIZED_TAG_AGGREGATE is the semantic唯一權威; this projector only
 *       maintains the read-side governance snapshot.
 * [D21] All tag governance/inference managed through VS8 SemanticCognitionEngine.
 *
 * Feed path: IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE → here.
 */

import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import {
  setDocument,
  serverTimestamp,
} from '@/shared-infra/frontend-firebase/firestore/firestore.write.adapter';
import { versionGuardAllows } from '@/shared-kernel';

// ---------------------------------------------------------------------------
// Read model shape
// ---------------------------------------------------------------------------

/** Lifecycle status of a governance proposal. */
export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

/** A governance proposal (rename, merge, deprecate, new tag). */
export interface GovernanceProposal {
  readonly proposalId: string;
  readonly proposalType: 'RENAME' | 'MERGE' | 'DEPRECATE' | 'NEW_TAG';
  readonly proposedBy: string;
  status: ProposalStatus;
  /** ISO-8601 timestamp */
  readonly createdAt: string;
  updatedAt: string;
  /** Freeform metadata supplied by VS8 SemanticCognitionEngine */
  readonly metadata: Record<string, unknown>;
}

/** A semantic relationship edge from this tag to another. */
export interface TagRelationshipEntry {
  readonly relatedTagSlug: string;
  readonly relationshipType: string;
  readonly weight: number;
}

/**
 * Per-tag semantic governance view.
 * Document key: semanticGovernanceView/tags/{tagSlug}
 */
export interface SemanticGovernanceTagView {
  readonly tagSlug: string;
  /** Human-readable wiki description (may be empty string). */
  wikiDescription: string;
  /** Active and historical proposals keyed by proposalId. */
  proposals: Record<string, GovernanceProposal>;
  /** Semantic relationship edges from this tag. */
  relationships: TagRelationshipEntry[];
  /** Monotonically increasing projection version [S2] */
  lastProcessedVersion: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

// ---------------------------------------------------------------------------
// Firestore path
// ---------------------------------------------------------------------------

function semGovTagPath(tagSlug: string): string {
  return `semanticGovernanceView/tags/${tagSlug}`;
}

// ---------------------------------------------------------------------------
// Projector functions (called by Event Funnel)
// ---------------------------------------------------------------------------

/**
 * Applies a wiki description update for a tag.
 *
 * [S2] Skips if the incoming aggregateVersion is not newer.
 * [R8] traceId forwarded.
 */
export async function applyTagWikiUpdated(params: {
  tagSlug: string;
  wikiDescription: string;
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { tagSlug, wikiDescription, aggregateVersion, traceId } = params;
  const docPath = semGovTagPath(tagSlug);

  const existing = await getDocument<SemanticGovernanceTagView>(docPath);

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }

  const view: Omit<SemanticGovernanceTagView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    tagSlug,
    wikiDescription,
    proposals: existing?.proposals ?? {},
    relationships: existing?.relationships ?? [],
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(docPath, view);
}

/**
 * Upserts a governance proposal record for a tag.
 *
 * [S2] Version guard at the document level.
 * [R8] traceId forwarded.
 */
export async function applyGovernanceProposalUpserted(params: {
  tagSlug: string;
  proposal: Omit<GovernanceProposal, 'updatedAt'> & { updatedAt: string };
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { tagSlug, proposal, aggregateVersion, traceId } = params;
  const docPath = semGovTagPath(tagSlug);

  const existing = await getDocument<SemanticGovernanceTagView>(docPath);

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }

  const updatedProposals: Record<string, GovernanceProposal> = {
    ...(existing?.proposals ?? {}),
    [proposal.proposalId]: proposal,
  };

  const view: Omit<SemanticGovernanceTagView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    tagSlug,
    wikiDescription: existing?.wikiDescription ?? '',
    proposals: updatedProposals,
    relationships: existing?.relationships ?? [],
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(docPath, view);
}

/**
 * Replaces the relationship list for a tag.
 * Called when VS8 recalculates semantic graph edges.
 *
 * [S2] Version guard at the document level.
 * [R8] traceId forwarded.
 */
export async function applyTagRelationshipsUpdated(params: {
  tagSlug: string;
  relationships: TagRelationshipEntry[];
  aggregateVersion: number;
  traceId?: string;
}): Promise<void> {
  const { tagSlug, relationships, aggregateVersion, traceId } = params;
  const docPath = semGovTagPath(tagSlug);

  const existing = await getDocument<SemanticGovernanceTagView>(docPath);

  if (
    !versionGuardAllows({
      eventVersion: aggregateVersion,
      viewLastProcessedVersion: existing?.lastProcessedVersion ?? 0,
    })
  ) {
    return;
  }

  const view: Omit<SemanticGovernanceTagView, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    tagSlug,
    wikiDescription: existing?.wikiDescription ?? '',
    proposals: existing?.proposals ?? {},
    relationships,
    lastProcessedVersion: aggregateVersion,
    ...(traceId !== undefined && { traceId }),
    updatedAt: serverTimestamp(),
  };

  await setDocument(docPath, view);
}
