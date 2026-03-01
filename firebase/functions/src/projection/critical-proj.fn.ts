/**
 * critical-proj.fn.ts — CRITICAL_PROJ_LANE Projection Processor
 *
 * [S4]  PROJ_STALE_CRITICAL ≤ 500ms
 *       Targets: workspace-scope-guard-view, org-eligible-member-view, wallet-balance
 * [S2]  SK_VERSION_GUARD: applyVersionGuard() before every write
 * [R8]  traceId carried in every projection record
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../ier/ier.fn";

if (getApps().length === 0) {
  initializeApp();
}

/** [S4] PROJ_STALE_CRITICAL ≤ 500ms */
const PROJ_STALE_CRITICAL_MS = 500;

/**
 * critical-proj: processes CRITICAL_PROJ_LANE events
 * Independent retry / dead-letter from STANDARD_PROJ_LANE
 */
export const criticalProj = onRequest(
  { region: "asia-east1", maxInstances: 20 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    const startMs = Date.now();
    const db = getFirestore();

    logger.info("CRITICAL_PROJ: processing", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      structuredData: true,
    });

    switch (envelope.eventType) {
      case "RoleChanged":
      case "PolicyChanged": {
        // workspace-scope-guard-view: authorization snapshot
        const viewDoc = await db
          .collection("projection.workspace-scope-guard-view")
          .doc(envelope.aggregateId)
          .get();
        const lastVersion = viewDoc.data()?.lastProcessedVersion ?? -1;
        if (envelope.aggregateVersion <= lastVersion) {
          logger.info("CRITICAL_PROJ: [S2] stale, discarding", { eventId: envelope.eventId, structuredData: true });
          res.status(200).json({ skipped: true });
          return;
        }
        await db
          .collection("projection.workspace-scope-guard-view")
          .doc(envelope.aggregateId)
          .set({
            ...(envelope.payload as Record<string, unknown>),
            lastProcessedVersion: envelope.aggregateVersion,
            traceId: envelope.traceId, // [R8]
            updatedAt: Timestamp.now(),
          }, { merge: true });
        break;
      }

      case "OrgContextProvisioned": {
        // org-eligible-member-view
        const viewDoc = await db
          .collection("projection.org-eligible-member-view")
          .doc(envelope.aggregateId)
          .get();
        const lastVersion = viewDoc.data()?.lastProcessedVersion ?? -1;
        if (envelope.aggregateVersion <= lastVersion) {
          res.status(200).json({ skipped: true });
          return;
        }
        await db
          .collection("projection.org-eligible-member-view")
          .doc(envelope.aggregateId)
          .set({
            ...(envelope.payload as Record<string, unknown>),
            lastProcessedVersion: envelope.aggregateVersion,
            traceId: envelope.traceId, // [R8]
            updatedAt: Timestamp.now(),
          }, { merge: true });
        break;
      }

      case "WalletDeducted":
      case "WalletCredited": {
        // wallet-balance: [S3] EVENTUAL_READ for display, STRONG_READ for transactions
        const viewDoc = await db
          .collection("projection.wallet-balance")
          .doc(envelope.aggregateId)
          .get();
        const lastVersion = viewDoc.data()?.lastProcessedVersion ?? -1;
        if (envelope.aggregateVersion <= lastVersion) {
          res.status(200).json({ skipped: true });
          return;
        }
        const payload = envelope.payload as { delta?: number };
        const current = viewDoc.data()?.balance ?? 0;
        await db
          .collection("projection.wallet-balance")
          .doc(envelope.aggregateId)
          .set({
            balance: current + (payload.delta ?? 0),
            lastProcessedVersion: envelope.aggregateVersion,
            traceId: envelope.traceId, // [R8]
            updatedAt: Timestamp.now(),
          }, { merge: true });
        break;
      }

      default:
        logger.warn("CRITICAL_PROJ: unhandled event type", {
          eventType: envelope.eventType, structuredData: true,
        });
    }

    const processingMs = Date.now() - startMs;
    if (processingMs > PROJ_STALE_CRITICAL_MS) {
      logger.warn("CRITICAL_PROJ: SLA breach [S4]", {
        processingMs,
        slaMs: PROJ_STALE_CRITICAL_MS, structuredData: true,
      });
    }

    res.status(200).json({ success: true, processingMs });
  }
);
