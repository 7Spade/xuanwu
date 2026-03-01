import type { Location } from './workspace.types'
import type { SkillRequirement } from './skill.types'
import type { Timestamp } from '@/shared/ports'

export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED' | 'COMPLETED';

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
  /** Who submitted this schedule proposal (workspace actor or automation). */
  proposedBy?: string;
  /**
   * Aggregate version — incremented on each state transition. [R7]
   * Used by domain functions and version guards to prevent stale writes.
   */
  version?: number;
  /** [R8] TraceID from the originating CBG_ENTRY — persisted for end-to-end audit. */
  traceId?: string;
}


