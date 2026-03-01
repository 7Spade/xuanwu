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

    // 2. Freeze the affected aggregate entity
    if (record.aggregateId) {
      await db.collection("frozen-entities").doc(record.aggregateId).set({
        aggregateId: record.aggregateId,
        eventId: record.eventId,
        eventType: record.eventType,
        traceId: record.traceId,
        frozenAt: Timestamp.now(),
        reason: "SECURITY_BLOCK_DLQ",
        unblockReason: null,
        status: "FROZEN",
      });
    }

    // 3. Write to domain-error-log (VS9) [R5]
    await db.collection("domain-error-log").add({
      level: "CRITICAL",
      source: "DLQ_SECURITY_BLOCK",
      eventId: record.eventId,
      eventType: record.eventType,
      aggregateId: record.aggregateId,
      traceId: record.traceId,
      message: `SECURITY_BLOCK: ${record.eventType} failed after max retries — entity frozen`,
      requiresSecurityTeamApproval: true,
      createdAt: Timestamp.now(),
    });

    // 4. Create security incident record for manual processing
    await db.collection("security-incidents").add({
      eventId: record.eventId,
      eventType: record.eventType,
      aggregateId: record.aggregateId,
      traceId: record.traceId,
      dlqDocPath: `${DLQ_BLOCK_COLLECTION}/${record.eventId}`,
      status: "OPEN",
      severity: "CRITICAL",
      autoReplayEnabled: false, // ⛔ never true for SECURITY_BLOCK
      createdAt: Timestamp.now(),
    });

    // TODO: alert security team via PagerDuty / Slack / email
    logger.error("DLQ_SECURITY_BLOCK: security incident created — awaiting security team review", {
      eventId: record.eventId,
      aggregateId: record.aggregateId,
      structuredData: true,
    });

    res.status(202).json({ accepted: true, eventId: record.eventId, status: "FROZEN" });
  }
);
