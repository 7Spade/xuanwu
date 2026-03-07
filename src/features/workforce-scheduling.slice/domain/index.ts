/**
 * Module: domain/index.ts
 * Purpose: Domain-layer public exports for VS6 workforce scheduling.
 * Responsibilities: Expose aggregate, rules, and pure domain logic.
 * Constraints: deterministic logic, respect module boundaries
 */

export {
  handleScheduleProposed,
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
  cancelOrgScheduleAssignment,
  orgScheduleProposalSchema,
  ORG_SCHEDULE_STATUSES,
} from './aggregate';

export type {
  OrgScheduleProposal,
  OrgScheduleStatus,
  ScheduleApprovalResult,
  WriteOp,
} from './aggregate';

export { canTransitionScheduleStatus, VALID_STATUS_TRANSITIONS } from './rules/schedule.rules';

export {
  SAGA_TIER_ORDER,
  sagaTierIndex,
  findEligibleCandidate,
  findEligibleCandidatesForRequirements,
} from './eligibility';

export type { SagaTier, CandidateAssignment } from './eligibility';
