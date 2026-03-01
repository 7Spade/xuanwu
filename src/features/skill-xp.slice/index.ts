/**
 * skill-xp.slice — Public API
 *
 * Consolidated skill-XP domain: Account skill XP, Org Skill Recognition,
 * Skill Tag Pool, and Account Skill View projection.
 *
 * Per logic-overview.md [E1]:
 *   SERVER_ACTION_SKILL → ACCOUNT_SKILL_AGGREGATE → ACCOUNT_SKILL_XP_LEDGER
 *   _actions.ts (application coordinator) → ORGANIZATION_EVENT_BUS (via IER routing)
 *   Aggregate does NOT publish to cross-BC buses directly (Invariant #3).
 *
 * Invariants enforced by this slice:
 *   #11 — XP belongs to Account BC; published to Organization only via events.
 *   #12 — Tier is NEVER stored; derive with resolveSkillTier(xp) from shared.kernel.skill-tier.
 *   #13 — Every XP change produces a Ledger entry BEFORE the aggregate write.
 *   T2  — SKILL_TAG_POOL = Tag Authority's org-scope projection (passive sync only).
 *   #17 — centralized-tag is the sole authority for tagSlug semantics.
 */

// ---------------------------------------------------------------------------
// Account XP Aggregate — Server Actions (entry point for UI/API callers)
// ---------------------------------------------------------------------------
export { addSkillXp, deductSkillXp } from './_actions';
export type { AddXpInput, DeductXpInput } from './_actions';

// ---------------------------------------------------------------------------
// Account XP Aggregate — domain operations (for other server-side slices)
// ---------------------------------------------------------------------------
export { addXp, deductXp, getSkillXp, SKILL_XP_MAX, SKILL_XP_MIN } from './_aggregate';
export type { AccountSkillRecord } from './_aggregate';

// ---------------------------------------------------------------------------
// XP Ledger types (for projectors that consume ledger entries)
// ---------------------------------------------------------------------------
export type { XpLedgerEntry } from './_ledger';

// ---------------------------------------------------------------------------
// Account Skill View Projector — called by projection.event-funnel [E1][S2]
// ---------------------------------------------------------------------------
export { applySkillXpAdded, applySkillXpDeducted } from './_projector';
export type { AccountSkillEntry } from './_projector';

// ---------------------------------------------------------------------------
// Skill Tag Pool — active operations and passive sync
// ---------------------------------------------------------------------------
export {
  addSkillTagToPool,
  removeSkillTagFromPool,
  incrementTagRefCount,
  decrementTagRefCount,
  // Passive consumer operations (called by projection.event-funnel on TagLifecycleEvents)
  syncTagUpdateToPool,
  syncTagDeprecationToPool,
  syncTagDeletionToPool,
} from './_tag-pool';
export type { OrgSkillTagEntry } from './_tag-pool';

// ---------------------------------------------------------------------------
// Org Skill Recognition Aggregate
// ---------------------------------------------------------------------------
export { grantSkillRecognition, revokeSkillRecognition } from './_org-recognition';
export type { OrgSkillRecognitionRecord, SkillRecognitionStatus } from './_org-recognition';

// ---------------------------------------------------------------------------
// Tag Lifecycle Subscriber — VS4_TAG_SUBSCRIBER [R3]
// Called by projection.event-funnel on IER BACKGROUND_LANE TagLifecycleEvents
// ---------------------------------------------------------------------------
export {
  handleTagUpdatedForPool,
  handleTagDeprecatedForPool,
  handleTagDeletedForPool,
} from './_tag-lifecycle';

// ---------------------------------------------------------------------------
// Read queries (Account Skill View + Skill Tag Pool + Org Skill Recognition)
// ---------------------------------------------------------------------------
export {
  getAccountSkillEntry,
  getAccountSkillView,
  getOrgSkillTag,
  getOrgSkillTags,
  getSkillRecognition,
  getMemberSkillRecognitions,
} from './_queries';

// ---------------------------------------------------------------------------
// FR-K1: Personal skill profile panel (XP + tier visualization)
// ---------------------------------------------------------------------------
export { PersonalSkillPanel } from './_components/personal-skill-panel';
