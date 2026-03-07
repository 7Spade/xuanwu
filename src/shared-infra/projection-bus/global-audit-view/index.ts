// projection-bus/global-audit-view · public API · 00-LogicOverview.md VS8 GLOBAL_AUDIT_VIEW [S2][R8]
export { applyAuditEvent } from './_projector';
export { getGlobalAuditEvents, getGlobalAuditEventsByWorkspace } from './_queries';
export type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';
