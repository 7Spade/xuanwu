/**
 * shared.kernel/schedule-contract — SK_SCHEDULE_CONTRACT [D19]
 *
 * Cross-BC canonical types for the Schedule domain.
 * Per D19 (docs/logic-overview.md): cross-BC contracts belong in shared.kernel.*;
 * shared/types is legacy fallback only.
 *
 * ScheduleItem and ScheduleStatus are referenced by:
 *   – scheduling.slice  (domain aggregate + actions)
 *   – projection.bus/demand-board  (projector read model)
 *   – workspace.slice/scheduling  (create/view)
 *   – projection.bus/account-schedule  (account projector)
 *   – shared/types/schedule.types.ts  (backward-compat re-export)
 *
 * [D8] This module is pure — no async functions, no Firestore calls, no side effects.
 * [D19] Move rule: once a type is used by more than one BC, it must live here.
 */

import type { SkillRequirement } from '@/features/shared-kernel/skill-tier';
import type { Timestamp } from '@/shared/ports';

/**
 * Physical location for a scheduled event.
 * Inlined here so schedule-contract has zero deps on @/shared/types (D8/D19).
 * TypeScript structural typing ensures compatibility with workspace.types.Location.
 */
export interface Location {
  building?: string; // 棟
  floor?: string;    // 樓
  room?: string;     // 室
  description: string;
}

/**
 * Lifecycle status of a ScheduleItem.
 *   PROPOSAL   — workspace proposed; awaiting org assignment.
 *   OFFICIAL   — at least one member assigned; confirmed.
 *   REJECTED   — cancelled (by org, workspace, or skill validation failure).
 *   COMPLETED  — event concluded.
 */
export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED' | 'COMPLETED';

/**
 * Canonical ScheduleItem document shape (single source of truth).
 * Stored at: accounts/{orgId}/schedule_items/{scheduleItemId}
 *
 * [R7] version — incremented on each state transition; used by versionGuardAllows.
 * [R8] traceId — forwarded from originating EventEnvelope.
 */
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
