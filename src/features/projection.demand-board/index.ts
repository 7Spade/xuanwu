/**
 * projection.demand-board — Public API
 *
 * Demand Board projection — org HR visibility into open/assigned schedule items.
 * Per docs/prd-schedule-workforce-skills.md FR-W0, FR-W6.
 *
 * Single source of truth: accounts/{orgId}/schedule_items
 *
 * Staleness tier: DEMAND_BOARD (≤ 5s per SK_STALENESS_CONTRACT).
 */

export {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from './_projector';

export {
  getActiveDemands,
  getAllDemands,
  subscribeToDemandBoard,
  DEMAND_BOARD_STALENESS,
} from './_queries';

export { DemandBoard } from './_components/demand-board';
