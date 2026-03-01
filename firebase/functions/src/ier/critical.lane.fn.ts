/**
 * critical.lane.fn.ts — IER CRITICAL_LANE Processor
 *
 * [P1]  高優先最終一致
 *       RoleChanged → Claims 刷新 [S6]
 *       WalletDeducted / WalletCredited
 *       OrgContextProvisioned
 * [R8]  envelope.traceId 禁止覆蓋
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { EventEnvelope } from "./ier.fn";

/** CRITICAL_LANE: high-priority delivery, invokes downstream handlers synchronously */
export const criticalLane = onRequest(
  { region: "asia-east1", maxInstances: 20 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    logger.info("CRITICAL_LANE: received", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      structuredData: true,
    });

    switch (envelope.eventType) {
      case "RoleChanged":
      case "PolicyChanged":
        // [S6] → claims-refresh-handler
        // TODO: call claims-refresh function or Pub/Sub
        logger.info("CRITICAL_LANE: routing to CLAIMS_HANDLER", {
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;

      case "OrgContextProvisioned":
        // [E2] → org-context.acl → Workspace local Context
        logger.info("CRITICAL_LANE: routing to ORG_ACL", {
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;

      case "WalletDeducted":
      case "WalletCredited":
        // Wallet balance projection update [S3: STRONG_READ for balance queries]
        logger.info("CRITICAL_LANE: routing WALLET event to projection", {
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;

      default:
        logger.warn("CRITICAL_LANE: unknown event type", {
          eventType: envelope.eventType,
          structuredData: true,
        });
    }

    // TODO: route to CRITICAL_PROJ_LANE for projection writes [S2]

    res.status(202).json({ accepted: true, lane: "CRITICAL", eventId: envelope.eventId });
  }
);
