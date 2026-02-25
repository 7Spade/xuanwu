/**
 * infra.outbox-relay — Public API
 *
 * OUTBOX Relay Worker — shared infrastructure engine. [R1]
 *
 * Per logic-overview_v9.md [R1] OUTBOX_RELAY_WORKER and tree.md:
 *   infra.outbox-relay = [R1] 搬運工 (掃描所有 OUTBOX 投遞至 IER)
 *
 * Usage: call `startOutboxRelay(collectionPath, deliveryFn)` once per OUTBOX
 * collection at application startup. All OUTBOX collections share this single
 * worker — no per-BC relay duplication.
 */
export { startOutboxRelay } from './_relay';
export type { OutboxDocument, OutboxStatus, IerDeliveryFn } from './_relay';
