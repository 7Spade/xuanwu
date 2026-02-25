/**
 * infra.event-router — Public API
 *
 * [IER] 事件路由中心 (分流不同 Lanes [R2])
 *
 * Per tree.md: infra.event-router = Integration Event Router
 *   — Receives events from infra.outbox-relay.
 *   — Routes events to the correct Lane:
 *       CRITICAL_LANE  — wallet, auth, claims (strong consistency)
 *       STANDARD_LANE  — schedule, roles (eventual consistency)
 *       BACKGROUND_LANE — tags, audit, notifications (fire-and-forget)
 *   — Fan-out to registered subscribers per event type.
 *
 * TODO: Implement IER with lane classification and subscriber registry.
 *
 * Lane definitions per R2:
 *   CRITICAL_LANE:    WalletDeducted, ClaimsRefreshed, RoleChanged
 *   STANDARD_LANE:    ScheduleAssigned, MemberJoined, MemberRemoved
 *   BACKGROUND_LANE:  TagCreated, TagUpdated, AuditLogged, FCMDelivered
 */

/** IER delivery lane classification. [R2] */
export type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';

// Placeholder — full routing implementation pending.
// Once implemented, export: registerSubscriber, publishToLane, type LaneSubscriber
export {};
