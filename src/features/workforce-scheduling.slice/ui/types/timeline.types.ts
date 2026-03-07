/**
 * Module: _timeline.types.ts
 * Purpose: Timeline slice local contracts.
 * Responsibilities: define lightweight types needed by timeline rendering.
 * Constraints: deterministic logic, respect module boundaries
 */

export interface TimelineMember {
  id: string;
  name: string;
}
