/**
 * projection.semantic-governance-view — Public API
 *
 * Semantic governance read model (治理頁 wiki/proposal/relationship).
 * Fed by IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE from VS8 events.
 *
 * Per 00-LogicOverview.md (VS8 → STD_PROJ_LANE):
 *   SEM_GOV_V["projection.semantic-governance-view\n治理頁 Read Model（wiki/proposal/relationship）\n顯示線路：L5→L6→UI"]
 *   QGWAY_SEM_GOV["→ .semantic-governance-view\n語義治理頁讀模型（提案/共識/關係）\n治理頁顯示必經 L5 投影"]
 */

export {
  getSemanticGovernanceView,
  getActiveGovernanceProposals,
  getTagRelationships,
  getAllSemanticGovernanceViews,
} from './_queries';

export {
  applyTagWikiUpdated,
  applyGovernanceProposalUpserted,
  applyTagRelationshipsUpdated,
} from './_projector';

export type {
  ProposalStatus,
  GovernanceProposal,
  TagRelationshipEntry,
  SemanticGovernanceTagView,
} from './_projector';
