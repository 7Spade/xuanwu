/**
 * @deprecated Use `@/features/shared-kernel` (ScheduleStatus, ScheduleItem) per D19/D20.
 * This file is a legacy backward-compat re-export and will be removed in a future clean-up.
 *
 * Original definition moved to shared-kernel/schedule-contract per D19:
 *   "cross-BC contracts belong in shared.kernel.*; shared/types is legacy fallback only."
 */
export type { ScheduleStatus, ScheduleItem } from '@/features/shared-kernel/schedule-contract';
