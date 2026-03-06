/**
 * Module: schedule-contract.ts
 * Purpose: define canonical cross-BC scheduling data contracts
 * Responsibilities: provide schedule status, location, and schedule item contracts
 * Constraints: deterministic logic, respect module boundaries
 */

import type { Timestamp } from '@/shared/ports';
import type { SkillRequirement } from '@/features/shared-kernel/skill-tier';

export interface Location {
  building?: string;
  floor?: string;
  room?: string;
  description: string;
}

export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED' | 'COMPLETED';
export type ScheduleTemporalKind = 'point' | 'range' | 'allDay';

export interface ScheduleItem {
  id: string;
  accountId: string;
  workspaceId: string;
  workspaceName?: string;
  title: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  startDate: Timestamp;
  endDate: Timestamp;
  temporalKind?: ScheduleTemporalKind;
  status: ScheduleStatus;
  originType: 'MANUAL' | 'TASK_AUTOMATION';
  originTaskId?: string;
  assigneeIds: string[];
  location?: Location;
  locationId?: string;
  requiredSkills?: SkillRequirement[];
  proposedBy?: string;
  version?: number;
  traceId?: string;
}
