/**
 * dlq-review.fn.ts — DLQ REVIEW_REQUIRED
 *
 * [R5]  REVIEW_REQUIRED: 金融/排班/角色事件・人工確認後 Replay
 *       包含: WalletDeducted / ScheduleAssigned / RoleChanged / OrgContextProvisioned
 * [S1]  idempotency-key 保留供 Replay 使用
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

const DLQ_REVIEW_COLLECTION = "dlq-review-required";

interface DlqReviewRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly traceId: string;
  readonly idempotencyKey: string; // [S1]
  readonly [key: string]: unknown;
}

/**
 * DLQ REVIEW_REQUIRED processor
 * Records the failed event and notifies for manual review.
 * Does NOT auto-replay — awaits explicit human approval.
 * POST body: DlqReviewRecord — called by outbox-relay after writing to dlq-review-required
 */
export const dlqReview = onRequest(
  { region: "asia-east1", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const record = req.body as DlqReviewRecord;
    if (!record?.eventId || !record.traceId) {
      res.status(400).json({ error: "Invalid DLQ record: missing eventId or traceId" });
      return;
    }

    const db = getFirestore();

    logger.warn("DLQ_REVIEW: manual review required", {
      eventId: record.eventId,
      eventType: record.eventType,
      traceId: record.traceId,
      idempotencyKey: record.idempotencyKey, // [S1] preserved for replay
      structuredData: true,
    });

    // Mark as awaiting review
    await db.collection(DLQ_REVIEW_COLLECTION).doc(record.eventId).set(
      { status: "AWAITING_REVIEW", receivedAt: Timestamp.now() },
      { merge: true }
    );

    // Create review request document for operator dashboard
    await db.collection("review-requests").add({
      eventId: record.eventId,
      eventType: record.eventType,
      aggregateId: record.aggregateId,
      traceId: record.traceId,
      idempotencyKey: record.idempotencyKey,
      dlqDocPath: `${DLQ_REVIEW_COLLECTION}/${record.eventId}`,
      status: "PENDING_REVIEW",
      createdAt: Timestamp.now(),
    });

    // TODO: notify on-call team (e.g., via PagerDuty, Slack webhook, or FCM)
    logger.warn("DLQ_REVIEW: review request created, awaiting human confirmation", {
      eventId: record.eventId,
      dlqTier: "REVIEW_REQUIRED",
      structuredData: true,
    });

    res.status(202).json({ accepted: true, eventId: record.eventId, status: "AWAITING_REVIEW" });
  }
);
