import type { Location } from './workspace.types'
import type { SkillRequirement } from './skill.types'
import type { Timestamp } from 'firebase/firestore'

export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED';

export interface ScheduleItem {
  id: string;
  accountId: string; // The owning Organization ID
  workspaceId: string;
  workspaceName?: string;
  title: string;
  description?: string;
  createdAt: Timestamp; // Firestore Timestamp
  updatedAt?: Timestamp; // Firestore Timestamp
  startDate: Timestamp; // Firestore Timestamp
  endDate: Timestamp; // Firestore Timestamp
  status: ScheduleStatus;
  originType: 'MANUAL' | 'TASK_AUTOMATION';
  originTaskId?: string;
  assigneeIds: string[];
  location?: Location;
  /** Sub-location within the workspace. FR-L2. */
  locationId?: string;
  /** Skill & staffing requirements proposed by the workspace. */
  requiredSkills?: SkillRequirement[];
}

/**
 * ScheduleDemand — Demand Board read model.
 * Per docs/prd-schedule-workforce-skills.md FR-W0 / FR-W6.
 *
 * Stored at: orgDemandBoard/{orgId}/demands/{scheduleItemId}
 *
 * Status semantics:
 *   open     — proposal submitted, awaiting assignment (FR-W0: visible to org HR)
 *   assigned — member confirmed (FR-W6: visible to org HR with assignee details)
 *   closed   — completed, cancelled, or rejected (FR-W0: hidden from default board view)
 *
 * closeReason: ScheduleDemand.closeReason enables audit traceability (PRD §3.2).
 */
export type ScheduleDemandStatus = 'open' | 'assigned' | 'closed';

/**
 * Typed union for demand close reasons — required for audit traceability (PRD §3.2, BR-D2/D3/D4).
 *
 *   completed           — schedule was fulfilled and completed normally (Invariant #15)
 *   assignmentCancelled — confirmed assignment was cancelled post-confirmation
 *   proposalCancelled   — HR cancelled the open proposal before assignment
 *   assignRejected      — skill-tier eligibility check failed (Invariant A5)
 */
export type ScheduleDemandCloseReason =
  | 'completed'
  | 'assignmentCancelled'
  | 'proposalCancelled'
  | 'assignRejected';

export interface ScheduleDemand {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  title: string;
  startDate: string;
  endDate: string;
  proposedBy: string;
  /** Resolved member ID after assignment. FR-W6. */
  assignedMemberId?: string;
  status: ScheduleDemandStatus;
  /**
   * Reason for closing the demand — required for audit traceability (PRD §3.2, BR-D2/D3/D4).
   * Populated when status transitions to 'closed'.
   */
  closeReason?: ScheduleDemandCloseReason;
  requiredSkills?: SkillRequirement[];
  /** Sub-location within the workspace. FR-L2. */
  locationId?: string;
  /** Human-readable workspace name — carried from the proposal for Demand Board display. */
  workspaceName?: string;
  /** Projection read-model version [S2]. */
  lastProcessedVersion?: number;
  /** [R8] TraceID from originating command — persisted for end-to-end audit. */
  traceId?: string;
  updatedAt: string; // ISO 8601
}
