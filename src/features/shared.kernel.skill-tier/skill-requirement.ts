/**
 * shared-kernel.skill-requirement
 *
 * Cross-BC staffing contract: describes the skill and headcount needs for a
 * schedule proposal.
 *
 * Flows from Workspace BC → Organization BC via WORKSPACE_OUTBOX events
 * (workspace:schedule:proposed, workspace:document-parser:itemsExtracted).
 *
 * Type definition lives in @/shared/types/skill.types (shared → features direction).
 * Re-exported here so callers can import from @/features/shared.kernel.skill-tier.
 */

export type { SkillRequirement } from '@/shared/types/skill.types';
