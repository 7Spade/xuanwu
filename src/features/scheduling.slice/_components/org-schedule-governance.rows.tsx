/**
 * Module: org-schedule-governance.rows
 * Purpose: Facade export for governance row components
 * Responsibilities: provide stable import path for ProposalRow and ConfirmedRow
 * Constraints: deterministic logic, respect module boundaries
 */

export { ProposalRow } from './org-schedule-governance.proposal-row';
export { ConfirmedRow } from './org-schedule-governance.confirmed-row';
