/**
 * shared.kernel.skill-tier — Public API
 *
 * [VS0] 技能等級與人力需求契約 (Skill Tier & Workforce Contracts)
 *
 * Per logic-overview_v9.md Invariant #12:
 *   "Tier 永遠是推導值（純函式 getTier(xp)），不得存入任何 DB 欄位"
 *
 * Three cohesive cross-BC contracts:
 *   skill-tier              — canonical seven-tier proficiency scale [SK_SKILL_TIER]
 *   skill-requirement       — cross-BC staffing requirement [SK_SKILL_REQ]
 *   schedule-proposed-payload — Workspace→Organization cross-BC event payload [A5][VS6]
 */

// Skill tier — canonical seven-tier proficiency scale and pure computation
export type { SkillTier, TierDefinition } from './skill-tier';
export {
  TIER_DEFINITIONS,
  getTierDefinition,
  resolveSkillTier,
  getTier,
  getTierRank,
  tierSatisfies,
} from './skill-tier';

// Skill requirement — cross-BC staffing contract for schedule proposals
export type { SkillRequirement } from './skill-requirement';

// Schedule proposed payload — Workspace BC → Organization BC cross-BC event payload [A5]
export type {
  WorkspaceScheduleProposedPayload,
  ImplementsScheduleProposedPayloadContract,
} from './schedule-proposed-payload';
