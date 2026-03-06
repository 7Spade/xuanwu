/**
 * Module: _types.ts
 * Purpose: Timelineing slice local contracts.
 * Responsibilities: define lightweight types needed by timeline rendering.
 * Constraints: deterministic logic, respect module boundaries
 */

export interface TimelineMember {
  id: string;
  name: string;
}
