/**
 * projection.account-skill-view — Public API
 *
 * Per-account skill XP read model. Feed: IER STANDARD_LANE → STD_PROJ_LANE.
 *
 * Per 00-LogicOverview.md (VS3 → STD_PROJ_LANE):
 *   SKILL_V["projection.account-skill-view\n[S2: SK_VERSION_GUARD]"]
 *
 * [S2] All writes enforce versionGuardAllows.
 * [R8] traceId propagated from EventEnvelope.
 * [#12] Tier is always derived via getTier(xp) — never stored.
 */

export { applySkillXpAdded, applySkillXpDeducted } from './_projector';
export type { AccountSkillEntry, AccountSkillView } from './_projector';

export { getAccountSkillView, getAccountSkillEntry, getAllAccountSkills } from './_queries';
