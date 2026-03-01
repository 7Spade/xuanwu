/**
 * background.lane.fn.ts — IER BACKGROUND_LANE Processor
 *
 * [P1]  SLA < 30s
 *       TagLifecycleEvent → tag-lifecycle-subscriber [T1]
 *       AuditEvents → audit-event-collector
 * [R8]  envelope.traceId 禁止覆蓋
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { EventEnvelope } from "./ier.fn";

/** BACKGROUND_LANE: eventual delivery, SLA < 30s */
export const backgroundLane = onRequest(
  { region: "asia-east1", maxInstances: 10 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    logger.info("BACKGROUND_LANE: received", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      structuredData: true,
    });

    switch (envelope.eventType) {
      case "TagLifecycleEvent":
        // [T1] → tag-lifecycle-subscriber → update SKILL_TAG_POOL
        // [S4] TAG_MAX_STALENESS ≤ 30s
        logger.info("BACKGROUND_LANE: routing TagLifecycleEvent to TAG_SUB", {
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;

      case "AuditEvent":
        // → audit-event-collector → GLOBAL_AUDIT_VIEW
        // [R8] audit record MUST include traceId
        logger.info("BACKGROUND_LANE: routing AuditEvent to AUDIT_COL", {
          eventId: envelope.eventId,
          traceId: envelope.traceId, // [R8] every audit record must contain traceId
          structuredData: true,
        });
        break;

      default:
        logger.info("BACKGROUND_LANE: forwarding to STANDARD_PROJ_LANE", {
          eventType: envelope.eventType,
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;
    }

    res.status(202).json({ accepted: true, lane: "BACKGROUND", eventId: envelope.eventId });
  }
);
