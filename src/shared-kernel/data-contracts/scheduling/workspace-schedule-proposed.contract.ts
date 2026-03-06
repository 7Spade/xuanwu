/**
 * Module: workspace-schedule-proposed.contract.ts
 * Purpose: define cross-BC Workspace → Scheduling proposal payload contract
 * Responsibilities: provide event payload schema for schedule proposal handoff
 * Constraints: deterministic logic, respect module boundaries
 */

import type { SkillRequirement } from '../skill-tier';

export interface WorkspaceScheduleProposedPayload {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly proposedBy: string;
  readonly intentId?: string;
  readonly skillRequirements?: SkillRequirement[];
  readonly locationId?: string;
  readonly traceId?: string;
}

export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
