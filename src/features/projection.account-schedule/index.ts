/**
 * projection.account-schedule — DEPRECATED shim
 *
 * All VS6 scheduling code has been consolidated into scheduling.slice.
 * This file re-exports for backward compatibility.
 * @deprecated Import from '@/features/scheduling.slice' directly.
 */
export {
  getAccountScheduleProjection,
  getAccountActiveAssignments,
  initAccountScheduleProjection,
  applyScheduleAssigned,
  applyScheduleCompleted,
} from '@/features/scheduling.slice';
export type { AccountScheduleProjection, AccountScheduleAssignment } from '@/features/scheduling.slice';
