/**
 * outbox-relay.fn.ts — OUTBOX Relay Worker
 *
 * [R1]  HTTPS endpoint: called by app-layer infra.outbox-relay CDC scanner
 *       POST body: OutboxRecord → delivers to IER → handles failures
 * [S1]  at-least-once delivery with idempotency-key
 *       失敗: retry backoff → 3 次 → DLQ
 *       監控: relay_lag → VS9
 * [R8]  traceId 從 envelope 讀取，禁止覆蓋
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import { dlqCollectionName } from "../types.js";

if (getApps().length === 0) {
  initializeApp();
}

const MAX_DELIVERY_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 500;

interface OutboxRecord extends EventEnvelope {
  deliveryAttempts: number;
  lastAttemptAt?: Timestamp;
  status: "PENDING" | "DELIVERED" | "FAILED";
}

/**
 * outbox-relay: HTTPS endpoint called by app-layer CDC scanner [R1]
 * POST body: OutboxRecord (single event envelope from any outbox collection)
 * Returns: 202 Accepted on delivery, 500 on DLQ routing
 */
export const outboxRelay = onRequest(
  { region: "asia-east1", maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const record = req.body as OutboxRecord;

    if (!record?.eventId || !record.traceId) {
      res.status(400).json({ error: "Invalid OutboxRecord: missing eventId or traceId" });
      return;
    }

    const relayStart = Date.now();

    logger.info("RELAY: processing outbox record", {
      eventId: record.eventId,
      eventType: record.eventType,
      traceId: record.traceId, // [R8] propagate read-only
      lane: record.lane,
      dlqTier: record.dlqTier,
      structuredData: true,
    });

    let delivered = false;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt++) {
      try {
        // TODO: call IER function URL directly based on record.lane
        await deliverToIer(record);
        delivered = true;
        break;
      } catch (err) {
        lastError = err;
        logger.warn(`RELAY: delivery attempt ${attempt} failed`, {
          eventId: record.eventId,
          error: String(err),
          structuredData: true,
        });
        if (attempt < MAX_DELIVERY_ATTEMPTS) {
          await sleep(INITIAL_BACKOFF_MS * 2 ** (attempt - 1));
        }
      }
    }

    const relayLag = Date.now() - relayStart;

    if (delivered) {
      logger.info("RELAY: delivered", {
        eventId: record.eventId,
        relayLagMs: relayLag,
        structuredData: true,
      });
      res.status(202).json({ accepted: true, eventId: record.eventId, relayLagMs: relayLag });
    } else {
      const db = getFirestore();
      await moveToDlq(db, record, lastError);
      res.status(500).json({
        error: "delivery failed, moved to DLQ",
        eventId: record.eventId,
        dlqTier: record.dlqTier,
      });
    }
  }
);

/** Deliver envelope to IER via direct HTTP call [R1] */
async function deliverToIer(record: OutboxRecord): Promise<void> {
  // TODO: call IER function URL directly based on record.lane
  //   const ierUrl = process.env.IER_FUNCTION_URL;
  //   await fetch(ierUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
  logger.info("RELAY→IER stub", {
    eventId: record.eventId,
    lane: record.lane,
    structuredData: true,
  });
}

/** Move failed event to the appropriate DLQ collection [S1] */
async function moveToDlq(
  db: FirebaseFirestore.Firestore,
  record: OutboxRecord,
  error: unknown
): Promise<void> {
  const collection = dlqCollectionName(record.dlqTier);
  await db.collection(collection).doc(record.eventId).set({
    ...record,
    failedAt: Timestamp.now(),
    failureReason: String(error),
    status: "DLQ",
  });
  logger.error("RELAY: moved to DLQ", {
    eventId: record.eventId,
    dlqTier: record.dlqTier,
    dlqCollection: collection,
    structuredData: true,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
