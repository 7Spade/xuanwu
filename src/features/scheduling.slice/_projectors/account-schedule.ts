/**
 * scheduling.slice/_projectors — account-schedule.ts
 *
 * Type definitions for the account schedule projection read model.
 * Projection write logic has been migrated to projection.bus/account-schedule/_projector.ts
 * per logic-overview.md (ACC_SCHED_V is a PROJ_BUS Standard Projection).
 *
 * These type exports are retained here so that scheduling.slice/_queries.ts
 * can type its read functions without introducing a cross-slice dependency
 * on projection.bus.
 */

import type { FieldValue } from '@/shared/infra/firestore/firestore.write.adapter';

export interface AccountScheduleProjection {
  accountId: string;
  /** Active schedule assignment IDs */
  activeAssignmentIds: string[];
  /** Map of scheduleItemId → { workspaceId, startDate, endDate } */
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  /** Last aggregate version processed by this projection [S2] */
  lastProcessedVersion?: number;
  /** TraceId from the originating EventEnvelope [R8] */
  traceId?: string;
  updatedAt: FieldValue;
}

export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
