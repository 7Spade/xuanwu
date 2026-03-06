/**
 * Module: _types.ts
 * Purpose: Local contracts for workforce-scheduling.slice.
 * Responsibilities: define slice-local shared UI types before shared-kernel promotion
 * Constraints: deterministic logic, respect module boundaries
 */

export interface TimelineMember {
  id: string;
  name: string;
}
