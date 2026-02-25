/**
 * shared-kernel — Public barrel
 *
 * Re-exports all Shared Kernel contracts so consumers can import from
 * "@/features/shared-kernel" instead of pointing at individual files.
 *
 * Rules (Invariant #8):
 *   - Every export here is an explicitly agreed cross-BC contract.
 *   - No infrastructure dependencies (no Firebase, no React, no I/O).
 *   - All additions must be discussed and agreed upon by the teams that own
 *     each affected Bounded Context before they land here.
 */

// Event envelope — canonical EventEnvelope contract (lives in shared.kernel.event-envelope)
export type {
  EventEnvelope,
  ImplementsEventEnvelopeContract,
} from '@/features/shared.kernel.event-envelope';

// Authority snapshot — canonical authority snapshot contract (lives in shared.kernel.authority-snapshot)
export type {
  AuthoritySnapshot,
  ImplementsAuthoritySnapshotContract,
} from '@/features/shared.kernel.authority-snapshot';

// Skill tier — canonical seven-tier proficiency scale [SK_SKILL_TIER] (lives in shared.kernel.skill-tier)
// Skill requirement — cross-BC staffing contract [SK_SKILL_REQ] (lives in shared.kernel.skill-tier)
// Schedule proposed payload — Workspace→Org cross-BC event payload [A5] (lives in shared.kernel.skill-tier)
export type { SkillTier, TierDefinition } from '@/features/shared.kernel.skill-tier';
export {
  TIER_DEFINITIONS,
  getTierDefinition,
  resolveSkillTier,
  getTier,
  getTierRank,
  tierSatisfies,
} from '@/features/shared.kernel.skill-tier';
export type { SkillRequirement } from '@/features/shared.kernel.skill-tier';
export type {
  WorkspaceScheduleProposedPayload,
  ImplementsScheduleProposedPayloadContract,
} from '@/features/shared.kernel.skill-tier';

// Command result contract — canonical result shape for all Command Handlers [R4]
// (lives in shared.kernel.contract-interfaces)
export type {
  DomainError,
  CommandSuccess,
  CommandFailure,
  CommandResult,
} from '@/features/shared.kernel.contract-interfaces';
export {
  commandSuccess,
  commandFailure,
  commandFailureFrom,
} from '@/features/shared.kernel.contract-interfaces';
