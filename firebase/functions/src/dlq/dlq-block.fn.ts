/**
 * dlq-block.fn.ts — DLQ SECURITY_BLOCK
 *
 * [R5]  SECURITY_BLOCK: 安全事件
 *       ⛔ 禁止自動 Replay — 必須人工審查
 *       步驟: 1. 告警 (DOMAIN_ERRORS)
 *             2. 凍結受影響實體
 *             3. 等待 security team 人工確認後才可 Replay
 * [S6]  Claims refresh failure → SECURITY_BLOCK
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

const DLQ_BLOCK_COLLECTION = "dlq-security-block";

interface DlqBlockRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly traceId: string;
  readonly [key: string]: unknown;
}

/**
 * DLQ SECURITY_BLOCK processor
 * ⛔ NEVER auto-replays. Freezes entity + alerts security team.
 * POST body: DlqBlockRecord — called by outbox-relay after writing to dlq-security-block
 */
export const dlqBlock = onRequest(
  { region: "asia-east1", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const record = req.body as DlqBlockRecord;
    if (!record?.eventId || !record.traceId) {
      res.status(400).json({ error: "Invalid DLQ record: missing eventId or traceId" });
      return;
    }

    const db = getFirestore();

    // ⛔ [R5] Log as SECURITY_BLOCK — never auto-replay
    logger.error("DLQ_SECURITY_BLOCK: security event failed — FREEZING entity", {
      eventId: record.eventId,
      eventType: record.eventType,
      aggregateId: record.aggregateId,
      traceId: record.traceId,
      dlqTier: "SECURITY_BLOCK",
      structuredData: true,
    });

    // Mark DLQ record as FROZEN
    await db.collection(DLQ_BLOCK_COLLECTION).doc(record.eventId).set(
      {
        status: "FROZEN",
        frozenAt: Timestamp.now(),
        // ⛔ autoReplayEnabled is explicitly false — security requirement
        autoReplayEnabled: false,
      },
      { merge: true }
    );

    // Freeze the affected aggregate entity
    if (record.aggregateId) {
      await db.collection("frozen-aggregates").doc(record.aggregateId).set(
        {
          frozenAt: Timestamp.now(),
          reason: "SECURITY_BLOCK",
          eventId: record.eventId,
          traceId: record.traceId, // [R8]
          // ⛔ No further operations are allowed until security team approves replay
        },
        { merge: true }
      );
    }

    // Alert path: write to domain-error-log for VS9 observability alerting [R5]
    await db.collection("domain-error-log").add({
      level: "CRITICAL",
      source: "DLQ_SECURITY_BLOCK",
      traceId: record.traceId, // [R8]
      aggregateId: record.aggregateId ?? null,
      eventType: record.eventType ?? null,
      message: `SECURITY_BLOCK: event ${record.eventId} failed — entity frozen, manual replay required`,
      details: null,
      recordedAt: Timestamp.now(),
    });

    logger.error("DLQ_SECURITY_BLOCK: entity frozen, review required before replay", {
      eventId: record.eventId,
      aggregateId: record.aggregateId,
      structuredData: true,
    });

    res.status(202).json({ accepted: true, eventId: record.eventId, status: "FROZEN" });
  }
);
