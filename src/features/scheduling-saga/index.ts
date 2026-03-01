/**
 * scheduling-saga — Public API
 *
 * [VS6] 跨組織排班協作 Saga 協調器
 *
 * Per logic-overview.md VS6:
 *   workspace-business.schedule   → publishes WorkspaceScheduleProposed
 *   scheduling-saga          → subscribes, checks org eligibility
 *   account-organization.schedule → receives ScheduleAssigned
 *   projection.org-eligible-member-view → [R7] version-checked member list
 *
 * Event flow:
 *   WorkspaceScheduleProposed → OrgEligibilityCheck → ScheduleAssigned
 *   (compensation: ScheduleAssignRejected on partial failure [A5])
 *
 * Usage (OUTBOX_RELAY_WORKER at app startup):
 *   const result = await startSchedulingSaga(event, `saga:${event.scheduleItemId}`);
 */

export { startSchedulingSaga, getSagaState } from './_saga';
export type { SagaState, SagaStep, SagaStatus } from './_saga';
