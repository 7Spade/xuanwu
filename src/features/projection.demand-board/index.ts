/**
 * projection.demand-board — DEPRECATED shim
 *
 * All VS6 scheduling code has been consolidated into scheduling.slice.
 * This file re-exports for backward compatibility.
 * @deprecated Import from '@/features/scheduling.slice' directly.
 */
export {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
  getActiveDemands,
  getAllDemands,
  subscribeToDemandBoard,
  DEMAND_BOARD_STALENESS,
} from '@/features/scheduling.slice';
