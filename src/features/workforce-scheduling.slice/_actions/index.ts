/**
 * Module: index.ts
 * Purpose: Public action barrel for scheduling slice.
 * Responsibilities: Re-export workspace, lifecycle, and governance actions.
 * Constraints: deterministic logic, respect module boundaries
 */

export {
  createScheduleItem,
  assignMember,
  unassignMember,
} from './workspace';

export {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
  updateScheduleItemDateRange,
} from './lifecycle';

export {
  manualAssignScheduleMember,
  cancelScheduleProposalAction,
  completeOrgScheduleAction,
} from './governance';
