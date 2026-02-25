/**
 * scheduling-core.saga — Public API
 *
 * [VS6] 跨組織排班協作 Saga 協調器
 *
 * Per tree.md: scheduling-core.saga = Cross-Organization Scheduling Saga Coordinator
 *   — Coordinates multi-step scheduling proposals across organization boundaries.
 *   — Orchestrates: WorkspaceScheduleProposed → OrgEligibilityCheck → ScheduleAssigned
 *   — Handles compensation (rollback) on partial failures.
 *   — Uses workspace-core.event-store for saga state persistence.
 *
 * Event flow per VS6:
 *   workspace-business.schedule   → publishes WorkspaceScheduleProposed
 *   scheduling-core.saga          → subscribes, checks org eligibility
 *   account-organization.schedule → receives ScheduleAssigned
 *   projection.org-eligible-member-view → [R7] version-checked member list
 *
 * TODO: Implement saga state machine with compensation logic.
 *
 * Cross-BC contracts (from shared-kernel):
 *   WorkspaceScheduleProposedPayload — event payload from workspace side
 *   SkillRequirement — staffing requirements for eligibility check
 */

// Placeholder — implementation pending.
// Once implemented, export: startSchedulingSaga, type SagaState, type SagaStep
export {};
