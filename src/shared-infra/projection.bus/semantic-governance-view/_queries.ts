/**
 * projection.semantic-governance-view — _queries.ts
 *
 * Read-side queries for the semantic governance tag view.
 * Per 00-LogicOverview.md (VS8 → STD_PROJ_LANE):
 *   QGWAY_SEM_GOV["→ .semantic-governance-view\n語義治理頁讀模型（提案/共識/關係）\n治理頁顯示必經 L5 投影"]
 *
 * [A6] CENTRALIZED_TAG_AGGREGATE is the sole semantic authority; this module
 *       only exposes the read-side governance snapshot produced by VS8.
 * [S4] PROJ_STALE_STANDARD ≤10s — standard projection staleness budget.
 * UI must read via L6 Query Gateway; direct Firebase access is prohibited [D5].
 */

import { db } from '@/shared-infra/frontend-firebase';
import {
  getDocs,
  collection,
  type QueryDocumentSnapshot,
} from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';
import { getDocument } from '@/shared-infra/frontend-firebase/firestore/firestore.read.adapter';

import type {
  SemanticGovernanceTagView,
  GovernanceProposal,
  TagRelationshipEntry,
} from './_projector';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the full governance view for a tag, including wiki description,
 * proposals, and relationship edges.
 *
 * Returns null if no governance events have been projected for this tag yet.
 */
export async function getSemanticGovernanceView(
  tagSlug: string
): Promise<SemanticGovernanceTagView | null> {
  return getDocument<SemanticGovernanceTagView>(
    `semanticGovernanceView/tags/${tagSlug}`
  );
}

/**
 * Returns all active governance proposals for a tag.
 * Filters to proposals that are not yet REJECTED or WITHDRAWN.
 */
export async function getActiveGovernanceProposals(
  tagSlug: string
): Promise<GovernanceProposal[]> {
  const view = await getSemanticGovernanceView(tagSlug);
  if (!view) return [];
  return Object.values(view.proposals).filter(
    (p) => p.status !== 'REJECTED' && p.status !== 'WITHDRAWN'
  );
}

/**
 * Returns the semantic relationship edges for a tag.
 * Used by the VS8 governance UI to render the tag relationship graph.
 */
export async function getTagRelationships(
  tagSlug: string
): Promise<TagRelationshipEntry[]> {
  const view = await getSemanticGovernanceView(tagSlug);
  return view?.relationships ?? [];
}

/**
 * Returns governance views for all tags in the semantic governance collection.
 * Used by the governance dashboard overview page.
 */
export async function getAllSemanticGovernanceViews(): Promise<SemanticGovernanceTagView[]> {
  const snap = await getDocs(collection(db, 'semanticGovernanceView/tags'));
  return snap.docs.map(
    (d: QueryDocumentSnapshot) => d.data() as SemanticGovernanceTagView
  );
}
