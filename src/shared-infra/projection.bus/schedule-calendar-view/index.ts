/**
 * projection.schedule-calendar-view — Public API
 *
 * Schedule calendar day read model (日期維度).
 * Fed by IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE.
 *
 * Per 00-LogicOverview.md (VS6 → STD_PROJ_LANE):
 *   CAL_PROJ["projection.schedule-calendar-view\n日期維度 Read Model [L5-Bus]\napplyVersionGuard() [S2]"]
 *   QGWAY_CAL["→ .schedule-calendar-view\n日期維度（UI 禁止直讀 VS6/Firebase）"]
 */

export {
  getScheduleCalendarDay,
  getAllScheduleCalendarDays,
} from './_queries';

export {
  applyScheduleCalendarUpsert,
  applyScheduleCalendarRemove,
} from './_projector';

export type {
  CalendarSlot,
  ScheduleCalendarDayView,
} from './_projector';
