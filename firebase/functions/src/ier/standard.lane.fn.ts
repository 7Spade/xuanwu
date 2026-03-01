/**
 * standard.lane.fn.ts — IER STANDARD_LANE Processor
 *
 * [P1]  非同步最終一致, SLA < 2s
 *       SkillXpAdded / SkillXpDeducted
 *       ScheduleAssigned / ScheduleProposed
 *       MemberJoined / MemberLeft
 *       All remaining domain events
 * [R8]  envelope.traceId 禁止覆蓋
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { EventEnvelope } from "./ier.fn";

/** STANDARD_LANE: async delivery for domain events, SLA < 2s */
export const standardLane = onRequest(
  { region: "asia-east1", maxInstances: 20 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    logger.info("STANDARD_LANE: received", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      structuredData: true,
    });

    switch (envelope.eventType) {
      case "ScheduleAssigned":
        // [E3] → notification-router
        logger.info("STANDARD_LANE: routing to NOTIF_R", {
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;

      case "WorkspaceScheduleProposed":
        // [#A5] → scheduling-saga
        logger.info("STANDARD_LANE: routing to SCH_SAGA", {
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;

      case "SkillXpAdded":
      case "SkillXpDeducted":
      case "MemberJoined":
      case "MemberLeft":
      case "AccountCreated":
      case "SkillRecognized":
      default:
        logger.info("STANDARD_LANE: forwarding to STANDARD_PROJ_LANE", {
          eventType: envelope.eventType,
          eventId: envelope.eventId,
          traceId: envelope.traceId,
          structuredData: true,
        });
        break;
    }

    // TODO: forward to STANDARD_PROJ_LANE for projection writes [S2]

    res.status(202).json({ accepted: true, lane: "STANDARD", eventId: envelope.eventId });
  }
);
