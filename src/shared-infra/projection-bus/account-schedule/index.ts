/**
 * projection-bus/account-schedule — Public API
 *
 * Account schedule read model.
 * Tracks active assignments per account to support availability filtering.
 *
 * Per 00-LogicOverview.md (PROJ_BUS STD_PROJ):
 *   ACC_SCHED_V["projection-bus/account-schedule"]
 *   Standard Projection: [S2 SK_VERSION_GUARD] [R8 traceId propagation]
 */

export {
  initAccountScheduleProjection,
  applyScheduleAssigned,
  applyScheduleCompleted,
} from './_projector';
export type {
  AccountScheduleProjection,
  AccountScheduleAssignment,
} from './_projector';

export {
  getAccountScheduleProjection,
  getAccountActiveAssignments,
} from './_queries';
