/**
 * dlq-review.fn.ts — DLQ REVIEW_REQUIRED
 *
 * [R5]  REVIEW_REQUIRED: 金融/排班/角色事件・人工確認後 Replay
 *       包含: WalletDeducted / ScheduleAssigned / RoleChanged / OrgContextProvisioned
 * [S1]  idempotency-key 保留供 Replay 使用
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

const DLQ_REVIEW_COLLECTION = "dlq-review-required";

/**
 * DLQ REVIEW_REQUIRED processor
 * Records the failed event and notifies for manual review.
 * Does NOT auto-replay — awaits explicit human approval.
 */
export const dlqReview = onDocumentCreated(
  { document: `${DLQ_REVIEW_COLLECTION}/{docId}`, region: "asia-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const record = snapshot.data();
    const db = getFirestore();

    logger.warn("DLQ_REVIEW: manual review required", {
      eventId: record.eventId,
      eventType: record.eventType,
      traceId: record.traceId,
      idempotencyKey: record.idempotencyKey, // [S1] preserved for replay
      structuredData: true,
    });

    // Mark as awaiting review
    await snapshot.ref.update({
      status: "AWAITING_REVIEW",
      receivedAt: Timestamp.now(),
    });

    // Create review request document for operator dashboard
    await db.collection("review-requests").add({
      eventId: record.eventId,
      eventType: record.eventType,
      aggregateId: record.aggregateId,
      traceId: record.traceId,
      idempotencyKey: record.idempotencyKey,
      dlqDocPath: snapshot.ref.path,
      status: "PENDING_REVIEW",
      createdAt: Timestamp.now(),
    });

    // TODO: notify on-call team (e.g., via PagerDuty, Slack webhook, or FCM)
    logger.warn("DLQ_REVIEW: review request created, awaiting human confirmation", {
      eventId: record.eventId,
      dlqTier: "REVIEW_REQUIRED",
      structuredData: true,
    });
  }
);
