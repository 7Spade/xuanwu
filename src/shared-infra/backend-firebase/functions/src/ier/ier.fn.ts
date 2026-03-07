/**
 * ier.fn.ts — Integration Event Router (IER) — Main Entry
 *
 * [#9]  統一事件出口
 * [R8]  保留 envelope.traceId — 禁止覆蓋
 * [P1]  優先級三道分層: CRITICAL / STANDARD / BACKGROUND
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type { EventEnvelope } from "../types.js";

// Re-export EventEnvelope so existing imports from this file continue to work
export type { EventEnvelope } from "../types.js";

/** Known event types for each lane */
const CRITICAL_EVENT_TYPES = new Set([
  "RoleChanged",
  "PolicyChanged",
  "WalletDeducted",
  "WalletCredited",
  "OrgContextProvisioned",
]);

const BACKGROUND_EVENT_TYPES = new Set([
  "TagLifecycleEvent",
  "AuditEvent",
]);

/**
 * Resolve IER lane from event type (CRITICAL > BACKGROUND > STANDARD default)
 */
export function resolveLane(
  eventType: string
): "CRITICAL" | "STANDARD" | "BACKGROUND" {
  if (CRITICAL_EVENT_TYPES.has(eventType)) return "CRITICAL";
  if (BACKGROUND_EVENT_TYPES.has(eventType)) return "BACKGROUND";
  return "STANDARD";
}

/**
 * integration-event-router (HTTP trigger)
 * Called by outbox-relay with the envelope payload.
 * Routes to the appropriate lane function.
 */
export const ier = onRequest(
  { region: "asia-east1", maxInstances: 20 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId || !envelope.traceId) {
      res.status(400).json({ error: "Invalid EventEnvelope: missing eventId or traceId" });
      return;
    }

    // [R8] Preserve traceId — do NOT regenerate
    const { traceId, eventId, eventType, lane: declaredLane } = envelope;
    const resolvedLane = declaredLane ?? resolveLane(eventType);

    logger.info("IER: routing event", {
      eventId,
      eventType,
      traceId, // [R8]
      lane: resolvedLane,
      structuredData: true,
    });

    // TODO: fan-out to lane-specific functions or Pub/Sub topics
    // Critical: immediate delivery for Role/Policy/Wallet events
    // Standard: async delivery for domain events
    // Background: eventual delivery for Tag/Audit events

    res.status(202).json({
      accepted: true,
      eventId,
      lane: resolvedLane,
      traceId,
    });
  }
);
