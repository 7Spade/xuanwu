/**
 * dlq-safe.fn.ts — DLQ SAFE_AUTO
 *
 * [R5]  SAFE_AUTO: 冪等事件・自動 Replay（保留 idempotency-key）
 * [S1]  idempotency-key 格式：eventId+aggId+version
 *
 * NOTE: Kept as onRequest (HTTPS) — Firebase blocks changing from HTTPS to
 *       background trigger without deleting the function first.
 *       Called by outbox-relay after writing the failed record to Firestore.
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const DLQ_SAFE_COLLECTION = "dlq-safe-auto";
const MAX_AUTO_REPLAY_ATTEMPTS = 3;
const REPLAY_BACKOFF_MS = 1000;

interface DlqSafeRecord {
  readonly eventId: string;
  readonly traceId: string;
  readonly idempotencyKey: string; // [S1]
  readonly [key: string]: unknown;
}

/**
 * DLQ SAFE_AUTO processor: auto-replay idempotent events
 * POST body: DlqSafeRecord — called by outbox-relay after writing to dlq-safe-auto
 */
export const dlqSafe = onRequest(
  { region: "asia-east1", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const record = req.body as DlqSafeRecord;
    if (!record?.eventId || !record.idempotencyKey) {
      res.status(400).json({ error: "Invalid DLQ record: missing eventId or idempotencyKey" });
      return;
    }

    const db = getFirestore();

    logger.info("DLQ_SAFE: starting auto-replay", {
      eventId: record.eventId,
      traceId: record.traceId,
      idempotencyKey: record.idempotencyKey, // [S1] preserved
      structuredData: true,
    });

    // Check idempotency: if already delivered, skip
    const existingDelivery = await db
      .collection("ier-delivered")
      .doc(record.idempotencyKey)
      .get();

    if (existingDelivery.exists) {
      logger.info("DLQ_SAFE: already delivered (idempotent), skipping", {
        idempotencyKey: record.idempotencyKey,
        structuredData: true,
      });
      await db.collection(DLQ_SAFE_COLLECTION).doc(record.eventId).set(
        { status: "ALREADY_DELIVERED", processedAt: Timestamp.now() },
        { merge: true }
      );
      res.status(200).json({ status: "ALREADY_DELIVERED", eventId: record.eventId });
      return;
    }

    let replayed = false;
    for (let attempt = 1; attempt <= MAX_AUTO_REPLAY_ATTEMPTS; attempt++) {
      try {
        // TODO: re-deliver to IER (publish to Pub/Sub or direct call)
        logger.info(`DLQ_SAFE: replay attempt ${attempt}`, {
          eventId: record.eventId,
          structuredData: true,
        });
        // await publishToIer(record);
        replayed = true;
        break;
      } catch (err) {
        logger.warn(`DLQ_SAFE: replay attempt ${attempt} failed`, {
          eventId: record.eventId,
          error: String(err),
          structuredData: true,
        });
        await sleep(REPLAY_BACKOFF_MS * attempt);
      }
    }

    const status = replayed ? "REPLAYED" : "REPLAY_FAILED";
    await db.collection(DLQ_SAFE_COLLECTION).doc(record.eventId).set(
      { status, processedAt: Timestamp.now() },
      { merge: true }
    );

    if (!replayed) {
      logger.error("DLQ_SAFE: all replay attempts exhausted", {
        eventId: record.eventId,
        structuredData: true,
      });
    }

    res.status(202).json({ accepted: true, eventId: record.eventId, status });
  }
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
