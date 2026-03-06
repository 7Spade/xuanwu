/**
 * Module: _events.ts
 * Purpose: Cross-slice event contracts for workforce-scheduling.slice.
 * Responsibilities: centralize IER/domain event payload typing for scheduling lifecycle
 * Constraints: deterministic logic, respect module boundaries
 */

export type WorkforceSchedulingEventName =
  | 'organization:schedule:assigned'
  | 'organization:schedule:assignRejected'
  | 'organization:schedule:proposalCancelled'
  | 'organization:schedule:completed'
  | 'organization:schedule:assignmentCancelled';

export interface WorkforceSchedulingLifecycleEventPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  traceId?: string;
}
