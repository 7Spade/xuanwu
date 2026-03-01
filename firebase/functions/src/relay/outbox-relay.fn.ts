/**
 * outbox-relay.fn.ts — OUTBOX Relay Worker
 *
 * [R1]  Firestore onSnapshot CDC: 掃描所有 OUTBOX → 投遞至 IER
 * [S1]  at-least-once delivery with idempotency-key
 *       失敗: retry backoff → 3 次 → DLQ
 *       監控: relay_lag → VS9
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

/** OUTBOX collection names shared across all domain slices */
const OUTBOX_COLLECTION = "outbox";
const MAX_DELIVERY_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 500;

/** EventEnvelope shape per SK_ENV contract */
interface EventEnvelope {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  /** [R8] traceId injected ONCE at CBG_ENTRY — never overwrite */
  readonly traceId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly idempotencyKey: string;
  readonly lane: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly dlqTier: "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
  readonly createdAt: Timestamp;
}

interface OutboxRecord extends EventEnvelope {
  deliveryAttempts: number;
  lastAttemptAt?: Timestamp;
  status: "PENDING" | "DELIVERED" | "FAILED";
}

/**
 * outbox-relay-worker: CDC trigger on new OUTBOX documents [R1]
 * Picks up newly created outbox entries and delivers them to IER.
 */
export const outboxRelay = onDocumentCreated(
  { document: `${OUTBOX_COLLECTION}/{docId}`, region: "asia-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("RELAY: empty snapshot, skipping");
      return;
    }

    const record = snapshot.data() as OutboxRecord;
    const docRef = snapshot.ref;
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
        // TODO: call IER function / Pub/Sub topic based on record.lane
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

    const db = getFirestore();
    const relayLag = Date.now() - relayStart;

    if (delivered) {
      await docRef.update({
        status: "DELIVERED",
        deliveredAt: Timestamp.now(),
        relayLagMs: relayLag,
      });
      logger.info("RELAY: delivered", {
        eventId: record.eventId,
        relayLagMs: relayLag,
        structuredData: true,
      });
    } else {
      // Route failed event to DLQ based on dlqTier [S1]
      await moveToDlq(db, record, lastError);
      await docRef.update({ status: "FAILED", failedAt: Timestamp.now() });
    }
  }
);

/** Deliver envelope to IER (stub — replace with Pub/Sub or direct call) */
async function deliverToIer(record: OutboxRecord): Promise<void> {
  // TODO: publish to Pub/Sub topic keyed by lane, OR call ier function directly
  // Pub/Sub approach (recommended for scale):
  //   const topic = `ier-${record.lane.toLowerCase()}`;
  //   await pubSubClient.topic(topic).publishMessage({ json: record });
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
  const dlqCollection = `dlq-${record.dlqTier.toLowerCase().replace("_", "-")}`;
  await db.collection(dlqCollection).doc(record.eventId).set({
    ...record,
    failedAt: Timestamp.now(),
    failureReason: String(error),
    status: "DLQ",
  });
  logger.error("RELAY: moved to DLQ", {
    eventId: record.eventId,
    dlqTier: record.dlqTier,
    dlqCollection,
    structuredData: true,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
