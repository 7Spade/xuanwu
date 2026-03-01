/**
 * Firebase Cloud Functions — Entry Point
 *
 * Architecture per docs/logic-overview_v1.md and docs/firebase-structure.md
 *
 * L2 Gateway:      command-gateway, webhook
 * L4 IER:          ier, criticalLane, standardLane, backgroundLane
 * L4 Relay:        outboxRelay
 * VS1 Claims:      claimsRefresh
 * DLQ:             dlqSafe, dlqReview, dlqBlock
 * L5 Projection:   eventFunnel, criticalProj, standardProj
 * L9 Observability: domainMetrics, domainErrors, domainErrorWatcher
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

// Initialize Firebase Admin SDK once
if (getApps().length === 0) {
  initializeApp();
}

// Global defaults: region + max-instances for cost control
setGlobalOptions({ region: "asia-east1", maxInstances: 10 });

// ── Shared Types (re-exported for consumers) ─────────────────────────────────
export type { EventEnvelope, DlqTier } from "./types";
export { dlqCollectionName } from "./types";
export {
  TAG_MAX_STALENESS_MS,
  PROJ_STALE_CRITICAL_MS,
  PROJ_STALE_STANDARD_MS,
} from "./staleness-contract";

// ── L2 Command Gateway ────────────────────────────────────────────────────────
export { commandGateway } from "./gateway/command-gateway.fn";
export { webhook }        from "./gateway/webhook.fn";

// ── L4 Outbox Relay ───────────────────────────────────────────────────────────
export { outboxRelay } from "./relay/outbox-relay.fn";

// ── L4 Integration Event Router (IER) ────────────────────────────────────────
export { ier }            from "./ier/ier.fn";
export { criticalLane }   from "./ier/critical.lane.fn";
export { standardLane }   from "./ier/standard.lane.fn";
export { backgroundLane } from "./ier/background.lane.fn";

// ── VS1 Claims Refresh ────────────────────────────────────────────────────────
export { claimsRefresh } from "./claims/claims-refresh.fn";

// ── DLQ Three-Tier ────────────────────────────────────────────────────────────
export { dlqSafe }   from "./dlq/dlq-safe.fn";
export { dlqReview } from "./dlq/dlq-review.fn";
export { dlqBlock }  from "./dlq/dlq-block.fn";

// ── L5 Projection Bus ─────────────────────────────────────────────────────────
export { eventFunnel }  from "./projection/event-funnel.fn";
export { criticalProj } from "./projection/critical-proj.fn";
export { standardProj } from "./projection/standard-proj.fn";

// ── L9 Observability ──────────────────────────────────────────────────────────
export { domainMetrics }                    from "./observability/domain-metrics.fn";
export { domainErrors, domainErrorWatcher } from "./observability/domain-errors.fn";
