/**
 * infra.event-router — Public API
 *
 * [IER] Integration Event Router — CRITICAL/STANDARD/BACKGROUND lanes [R2]
 *
 * Per logic-overview_v9.md [R2]:
 *   OUTBOX_RELAY_WORKER delivers to IER → IER fan-outs to lane subscribers.
 *
 * Lane definitions:
 *   CRITICAL_LANE:    WalletDeducted, ClaimsRefreshed, RoleChanged
 *   STANDARD_LANE:    ScheduleAssigned, MemberJoined, MemberRemoved
 *   BACKGROUND_LANE:  TagCreated, TagUpdated, AuditLogged, FCMDelivered
 *
 * Usage (application bootstrap):
 *   import { registerSubscriber, publishToLane } from '@/features/infra.event-router';
 *   import { startOutboxRelay } from '@/features/infra.outbox-relay';
 *
 *   registerSubscriber('tag:created', onTagCreated, 'BACKGROUND_LANE');
 *   startOutboxRelay('tagOutbox', publishToLane);
 */

/** IER delivery lane classification. [R2] */
export type { IerLane } from './_router';

export { registerSubscriber, routeEvent, publishToLane } from './_router';
