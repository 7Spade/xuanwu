/**
 * projection.schedule-timeline-view — Public API
 *
 * Schedule resource-dimension timeline read model (資源維度).
 * Overlap/grouping are pre-computed at L5; UI renders directly from this view.
 * Fed by IER STANDARD_LANE → FUNNEL → STD_PROJ_LANE.
 *
 * Per 00-LogicOverview.md (VS6 → STD_PROJ_LANE):
 *   TL_PROJ["projection.schedule-timeline-view\n資源維度 Read Model [L5-Bus]\noverlap/resource-grouping 下沉 L5\napplyVersionGuard() [S2]"]
 *   QGWAY_TL["→ .schedule-timeline-view\n資源維度（overlap/grouping 已預計算）"]
 */

export {
  getScheduleTimelineForMember,
  getAllScheduleTimelines,
} from './_queries';

export {
  applyTimelineUpsert,
  applyTimelineRemove,
} from './_projector';

export type {
  TimelineBlock,
  ScheduleTimelineMemberView,
} from './_projector';
