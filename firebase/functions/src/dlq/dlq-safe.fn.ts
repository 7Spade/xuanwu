/**
 * dlq-safe.fn.ts — DLQ SAFE_AUTO
 *
 * [R5]  SAFE_AUTO: 冪等事件・自動 Replay（保留 idempotency-key）
 * [S1]  idempotency-key 格式：eventId+aggId+version
 */

import {
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const DLQ_SAFE_COLLECTION = "dlq-safe-auto";
const MAX_AUTO_REPLAY_ATTEMPTS = 3;
const REPLAY_BACKOFF_MS = 1000;

/**
 * DLQ SAFE_AUTO processor: auto-replay idempotent events
 * Triggered when a new document is written to dlq-safe-auto collection
 */
export const dlqSafe = onDocumentCreated(
  { document: `${DLQ_SAFE_COLLECTION}/{docId}`, region: "asia-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const record = snapshot.data();
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
      await snapshot.ref.update({ status: "ALREADY_DELIVERED", processedAt: Timestamp.now() });
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
    await snapshot.ref.update({ status, processedAt: Timestamp.now() });

    if (!replayed) {
      logger.error("DLQ_SAFE: all replay attempts exhausted", {
        eventId: record.eventId,
        structuredData: true,
      });
    }
  }
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
