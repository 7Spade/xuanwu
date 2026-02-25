/**
 * infra.dlq-manager — Public API
 *
 * Dead-Letter Queue (DLQ) fault-containment center. [R5]
 *
 * Per logic-overview_v9.md [R5] DLQ 三級策略 and tree.md:
 *   infra.dlq-manager = [R5] 故障收容中心 (SAFE_AUTO / REVIEW_REQUIRED / SECURITY_BLOCK)
 *
 * Consumers:
 *   - infra.outbox-relay: attaches dlqLevel to every DLQ entry it writes.
 *   - DLQ admin tooling: reads dlqLevel to determine replay policy.
 */
export { getDlqLevel } from './_dlq';
export type { DlqLevel, DlqEntry } from './_dlq';
