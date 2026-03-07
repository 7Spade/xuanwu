/**
 * @deprecated Moved to projection.bus/demand-board. This file re-exports for
 * backward compatibility and will be removed in a future clean-up.
 */
export {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from '@/features/projection.bus';
