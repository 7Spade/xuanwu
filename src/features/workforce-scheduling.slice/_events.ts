/**
 * Module: _events.ts
 * Purpose: IER (Inter-slice Event Registry) event definitions for workforce-scheduling.
 * Responsibilities: declare all events that cross slice boundaries via the event bus.
 * Constraints: [D11] events only; no business logic; no Firestore imports.
 *
 * Consumers:
 *   - projection.bus/_workspace-funnel listens to W_B_SCHEDULE for schedule mutations.
 *   - workspace.slice/core/_hooks uses USE_SCHEDULE_EVENT to trigger schedule actions.
 */

// =================================================================
// Inbound events (this slice consumes)
// =================================================================

/**
 * Emitted by workspace.slice when a booked task item should become a schedule
 * proposal.  Routing: W_B_SCHEDULE channel [D11].
 */
export const WORKFORCE_SCHEDULE_PROPOSED_EVENT = 'workforce_scheduling/schedule_proposed' as const;

/**
 * Emitted by workspace.slice when an existing schedule item needs a date-range
 * update (drag-and-drop reschedule from Timeline or Calendar view).
 * Routing: W_B_SCHEDULE channel [D11].
 */
export const WORKFORCE_TIMELINE_DATE_RANGE_UPDATED_EVENT =
  'workforce_scheduling/timeline_date_range_updated' as const;

// =================================================================
// Outbound events (this slice publishes)
// =================================================================

/**
 * Published after a schedule proposal has been approved.
 * Downstream: projection.bus/account-schedule updates the read-model.
 */
export const WORKFORCE_SCHEDULE_APPROVED_EVENT = 'workforce_scheduling/schedule_approved' as const;

/**
 * Published after a schedule assignment has been cancelled.
 * Downstream: projection.bus/account-schedule updates the read-model.
 */
export const WORKFORCE_SCHEDULE_ASSIGNMENT_CANCELLED_EVENT =
  'workforce_scheduling/schedule_assignment_cancelled' as const;

// =================================================================
// Event type union (for type-safe event handlers)
// =================================================================

export type WorkforceSchedulingEvent =
  | typeof WORKFORCE_SCHEDULE_PROPOSED_EVENT
  | typeof WORKFORCE_TIMELINE_DATE_RANGE_UPDATED_EVENT
  | typeof WORKFORCE_SCHEDULE_APPROVED_EVENT
  | typeof WORKFORCE_SCHEDULE_ASSIGNMENT_CANCELLED_EVENT;
