/**
 * Module: ports/index.ts
 * Purpose: Public port contracts for VS6 workforce scheduling.
 * Responsibilities: Provide stable command/query/event port types for boundary migration.
 * Constraints: deterministic logic, respect module boundaries
 */

export type {
  SchedulingCommandPort,
  CreateScheduleItemInput,
  ManualAssignOptions,
} from './command.port';

export type {
  SchedulingQueryPort,
  SchedulingStalenessContractPort,
  QueryUnsubscribe,
  OrgEligibleMemberView,
  OrgMemberSkillWithTier,
} from './query.port';

export type {
  SchedulingEventPort,
  SchedulingOutboxLane,
  SchedulingOutboxRouting,
  SchedulingOutboxAck,
} from './event.port';
