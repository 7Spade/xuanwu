/**
 * Module: _types.ts
 * Purpose: Workforce-scheduling slice local contracts.
 * Responsibilities: define lightweight view-model types shared by CalendarView and TimelineView.
 * Constraints: deterministic logic, respect module boundaries
 *
 * [D19] Cross-domain types that are not yet in shared.kernel are kept here
 *       and annotated for future promotion.
 */

/**
 * Lightweight member reference used by the TimelineView canvas.
 *
 * TODO [D19]: Promote to shared.kernel once the Member aggregate is stable.
 */
export interface TimelineMember {
  id: string;
  name: string;
}
