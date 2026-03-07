/**
 * standard-proj.fn.ts — STANDARD_PROJ_LANE Projection Processor
 *
 * [S4]  PROJ_STALE_STANDARD ≤ 10s
 *       Targets: workspace-view, account-schedule, account-view,
 *                organization-view, account-skill-view, global-audit-view, tag-snapshot
 * [S2]  SK_VERSION_GUARD: applyVersionGuard() before every write
 * [R8]  traceId carried in every projection record
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";

if (getApps().length === 0) {
  initializeApp();
}

// [S4] PROJ_STALE_STANDARD_MS imported from staleness-contract

/** Standard projection view → collection name mapping */
const VIEW_MAP: Record<string, string> = {
  AccountCreated:              "projection.account-view",
  MemberJoined:                "projection.organization-view",
  MemberLeft:                  "projection.organization-view",
  SkillXpAdded:                "projection.account-skill-view",
  SkillXpDeducted:             "projection.account-skill-view",
  SkillRecognized:             "projection.account-skill-view",
  ScheduleAssigned:            "projection.account-schedule",
  WorkspaceScheduleProposed:   "projection.workspace-view",
  TagLifecycleEvent:           "projection.tag-snapshot",
  AuditEvent:                  "projection.global-audit-view",
};

/**
 * standard-proj: processes STANDARD_PROJ_LANE events
 * Independent retry / dead-letter from CRITICAL_PROJ_LANE
 */
export const standardProj = onRequest(
  { region: "asia-east1", maxInstances: 20 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    const startMs = Date.now();
    const db = getFirestore();

    const viewCollection = VIEW_MAP[envelope.eventType];
    if (!viewCollection) {
      logger.warn("STANDARD_PROJ: no view mapping for event type", {
        eventType: envelope.eventType, structuredData: true,
      });
      res.status(200).json({ skipped: true, reason: "no view mapping" });
      return;
    }

    logger.info("STANDARD_PROJ: processing", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      viewCollection,
      structuredData: true,
    });

    // [S2] Version guard
    const viewDoc = await db.collection(viewCollection).doc(envelope.aggregateId).get();
    const lastVersion = viewDoc.data()?.lastProcessedVersion ?? -1;
    if (envelope.aggregateVersion <= lastVersion) {
      logger.info("STANDARD_PROJ: [S2] stale event, discarding", {
        eventId: envelope.eventId, incomingVersion: envelope.aggregateVersion, lastVersion,
        structuredData: true,
      });
      res.status(200).json({ skipped: true, reason: "stale [S2]" });
      return;
    }

    // [Q3] upsert by idempotency-key
    await db.collection(viewCollection).doc(envelope.aggregateId).set(
      {
        ...(envelope.payload as Record<string, unknown>),
        lastEventType: envelope.eventType,
        lastEventId: envelope.eventId,
        lastProcessedVersion: envelope.aggregateVersion, // [S2]
        traceId: envelope.traceId, // [R8] every projection record must contain traceId
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    const processingMs = Date.now() - startMs;
    if (processingMs > PROJ_STALE_STANDARD_MS) {
      logger.warn("STANDARD_PROJ: SLA breach [S4]", {
        processingMs, slaMs: PROJ_STALE_STANDARD_MS, structuredData: true,
      });
    }

    logger.info("STANDARD_PROJ: written", {
      eventId: envelope.eventId,
      viewCollection,
      traceId: envelope.traceId, // [R8] → DOMAIN_METRICS
      processingMs,
      structuredData: true,
    });

    res.status(200).json({ success: true, viewCollection, processingMs });
  }
);
