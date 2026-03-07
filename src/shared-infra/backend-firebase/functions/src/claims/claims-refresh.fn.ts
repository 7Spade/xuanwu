/**
 * claims-refresh.fn.ts — CLAIMS_HANDLER
 *
 * [S6]  SK_TOKEN_REFRESH_CONTRACT
 *       觸發：RoleChanged | PolicyChanged (from IER CRITICAL_LANE)
 *       步驟：1. 讀取最新 role/policy
 *             2. 更新 Firebase Auth Custom Claims
 *             3. 發出 TOKEN_REFRESH_SIGNAL
 *       失敗：→ DLQ SECURITY_BLOCK + 告警
 * [R8]  traceId 從 envelope 讀取，禁止覆蓋
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";

if (getApps().length === 0) {
  initializeApp();
}

interface ClaimsRefreshPayload {
  readonly userId: string;
  readonly orgId?: string;
  readonly roles?: string[];
  readonly scopes?: string[];
}

/**
 * claims-refresh-handler — CLAIMS_H
 * [S6] Triggered by RoleChanged / PolicyChanged events from CRITICAL_LANE
 */
export const claimsRefresh = onRequest(
  { region: "asia-east1", maxInstances: 5 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope & { payload: ClaimsRefreshPayload };

    if (!envelope?.eventId || !envelope.traceId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    // [S6] Only handle RoleChanged / PolicyChanged
    if (envelope.eventType !== "RoleChanged" && envelope.eventType !== "PolicyChanged") {
      res.status(422).json({
        error: `Unexpected event type for claims refresh: ${envelope.eventType}`,
      });
      return;
    }

    const { userId, orgId, roles, scopes } = envelope.payload ?? {};

    if (!userId) {
      res.status(400).json({ error: "payload.userId is required" });
      return;
    }

    logger.info("CLAIMS_HANDLER: refreshing custom claims", {
      userId,
      orgId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      structuredData: true,
    });

    try {
      const db = getFirestore();
      const auth = getAuth();

      // 1. Read latest authoritative role/policy from Firestore (STRONG_READ [S3])
      const accountDoc = await db
        .collection("accounts")
        .doc(userId)
        .get();

      const accountData = accountDoc.data() ?? {};
      const latestRoles: string[] = accountData.roles ?? roles ?? [];
      const latestScopes: string[] = accountData.scopes ?? scopes ?? [];
      const latestOrgId: string | undefined = accountData.activeOrgId ?? orgId;

      // 2. Build custom claims snapshot [#5]
      const customClaims: Record<string, unknown> = {
        roles: latestRoles,
        scopes: latestScopes,
        ...(latestOrgId ? { orgId: latestOrgId } : {}),
        claimsUpdatedAt: Date.now(),
      };

      // 3. Update Firebase Auth Custom Claims [S6]
      await auth.setCustomUserClaims(userId, customClaims);

      // 4. Emit TOKEN_REFRESH_SIGNAL (write to Firestore signaling collection) [S6]
      await db.collection("token-refresh-signals").doc(userId).set({
        userId,
        traceId: envelope.traceId, // [R8]
        signalledAt: Timestamp.now(),
        eventType: envelope.eventType,
      });

      logger.info("CLAIMS_HANDLER: claims refreshed, TOKEN_REFRESH_SIGNAL emitted", {
        userId,
        traceId: envelope.traceId,
        structuredData: true,
      });

      res.status(200).json({
        success: true,
        userId,
        traceId: envelope.traceId,
        signal: "TOKEN_REFRESH_SIGNAL",
      });
    } catch (err) {
      // [S6] Failure → DLQ SECURITY_BLOCK + alert
      logger.error("CLAIMS_HANDLER: failed to refresh claims → SECURITY_BLOCK", {
        userId,
        traceId: envelope.traceId,
        error: String(err),
        structuredData: true,
      });

      // TODO: write to dlq-security-block collection for manual review
      await getFirestore()
        .collection("dlq-security-block")
        .doc(envelope.eventId)
        .set({
          ...envelope,
          failedAt: Timestamp.now(),
          failureReason: String(err),
          status: "DLQ",
        });

      res.status(500).json({
        success: false,
        error: { code: "CLAIMS_REFRESH_FAILED", message: String(err) },
      });
    }
  }
);
