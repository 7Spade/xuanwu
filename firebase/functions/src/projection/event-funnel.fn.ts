/**
 * event-funnel.fn.ts — Event Funnel (FUNNEL)
 *
 * [#9]  唯一 Projection 寫入路徑
 * [Q3]  upsert by idempotency-key
 * [R8]  從 envelope 讀取 traceId → DOMAIN_METRICS
 * [S2]  所有 Lane 遵守 SK_VERSION_GUARD
 *       event.aggregateVersion > view.lastProcessedVersion → 允許更新，否則丟棄
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../ier/ier.fn";

if (getApps().length === 0) {
  initializeApp();
}

/** [S4] SK_STALENESS_CONTRACT — reference constants, never hardcode */
const PROJ_STALE_CRITICAL_MS = 500;  // [S4] PROJ_STALE_CRITICAL ≤ 500ms
const PROJ_STALE_STANDARD_MS = 10_000; // [S4] PROJ_STALE_STANDARD ≤ 10s

/**
 * [S2] SK_VERSION_GUARD: discard stale events before any Projection write
 */
async function applyVersionGuard(
  db: FirebaseFirestore.Firestore,
  viewCollection: string,
  aggregateId: string,
  incomingVersion: number
): Promise<boolean> {
  const viewDoc = await db.collection(viewCollection).doc(aggregateId).get();
  const lastProcessedVersion: number = viewDoc.data()?.lastProcessedVersion ?? -1;
  const allowed = incomingVersion > lastProcessedVersion;
  if (!allowed) {
    logger.info("FUNNEL: [S2] version guard — discarding stale event", {
      aggregateId,
      incomingVersion,
      lastProcessedVersion,
      structuredData: true,
    });
  }
  return allowed;
}

/**
 * event-funnel: [#9] the ONLY Projection write path
 * Receives events from IER lanes and writes to appropriate read-model views.
 */
export const eventFunnel = onRequest(
  { region: "asia-east1", maxInstances: 20 },
  async (req, res) => {
    const envelope = req.body as EventEnvelope;

    if (!envelope?.eventId || !envelope.traceId) {
      res.status(400).json({ error: "Invalid EventEnvelope" });
      return;
    }

    const startMs = Date.now();
    const db = getFirestore();

    logger.info("FUNNEL: processing event", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      traceId: envelope.traceId, // [R8]
      aggregateVersion: envelope.aggregateVersion,
      structuredData: true,
    });

    // Determine target projection collection from event type
    const projectionTarget = resolveProjectionTarget(envelope.eventType);
    if (!projectionTarget) {
      logger.warn("FUNNEL: no projection target for event type", {
        eventType: envelope.eventType,
        structuredData: true,
      });
      res.status(200).json({ skipped: true, reason: "no projection target" });
      return;
    }

    // [S2] Version guard — discard stale events
    const allowed = await applyVersionGuard(
      db,
      projectionTarget.viewCollection,
      envelope.aggregateId,
      envelope.aggregateVersion
    );

    if (!allowed) {
      res.status(200).json({
        skipped: true,
        reason: "stale event discarded by version guard [S2]",
      });
      return;
    }

    // [Q3] upsert by idempotency-key
    await db
      .collection(projectionTarget.viewCollection)
      .doc(envelope.aggregateId)
      .set(
        {
          ...buildProjectionUpdate(envelope),
          lastProcessedVersion: envelope.aggregateVersion, // [S2]
          traceId: envelope.traceId, // [R8] every projection record must contain traceId
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

    const processingMs = Date.now() - startMs;
    const slaSatisfied = checkSla(projectionTarget.lane, processingMs);

    // [R8] Emit metrics with traceId
    logger.info("FUNNEL: projection written", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      viewCollection: projectionTarget.viewCollection,
      traceId: envelope.traceId, // [R8] → DOMAIN_METRICS
      processingMs,
      slaSatisfied,
      lane: projectionTarget.lane,
      structuredData: true,
    });

    res.status(200).json({
      success: true,
      eventId: envelope.eventId,
      viewCollection: projectionTarget.viewCollection,
      processingMs,
    });
  }
);

interface ProjectionTarget {
  viewCollection: string;
  lane: "CRITICAL" | "STANDARD";
}

function resolveProjectionTarget(eventType: string): ProjectionTarget | null {
  const projectionMap: Record<string, ProjectionTarget> = {
    // CRITICAL projections [S4: ≤500ms]
    RoleChanged:             { viewCollection: "projection.workspace-scope-guard-view", lane: "CRITICAL" },
    PolicyChanged:           { viewCollection: "projection.workspace-scope-guard-view", lane: "CRITICAL" },
    OrgContextProvisioned:   { viewCollection: "projection.org-eligible-member-view",   lane: "CRITICAL" },
    WalletDeducted:          { viewCollection: "projection.wallet-balance",              lane: "CRITICAL" },
    WalletCredited:          { viewCollection: "projection.wallet-balance",              lane: "CRITICAL" },
    // STANDARD projections [S4: ≤10s]
    AccountCreated:          { viewCollection: "projection.account-view",                lane: "STANDARD" },
    MemberJoined:            { viewCollection: "projection.organization-view",           lane: "STANDARD" },
    MemberLeft:              { viewCollection: "projection.organization-view",           lane: "STANDARD" },
    SkillXpAdded:            { viewCollection: "projection.account-skill-view",          lane: "STANDARD" },
    SkillXpDeducted:         { viewCollection: "projection.account-skill-view",          lane: "STANDARD" },
    ScheduleAssigned:        { viewCollection: "projection.account-schedule",            lane: "STANDARD" },
    WorkspaceScheduleProposed: { viewCollection: "projection.workspace-view",            lane: "STANDARD" },
    TagLifecycleEvent:       { viewCollection: "projection.tag-snapshot",                lane: "STANDARD" },
    AuditEvent:              { viewCollection: "projection.global-audit-view",           lane: "STANDARD" },
  };
  return projectionMap[eventType] ?? null;
}

function buildProjectionUpdate(envelope: EventEnvelope): Record<string, unknown> {
  // Each event type may update different fields — extend per domain
  return {
    aggregateId: envelope.aggregateId,
    lastEventType: envelope.eventType,
    lastEventId: envelope.eventId,
    ...(envelope.payload as Record<string, unknown>),
  };
}

function checkSla(lane: "CRITICAL" | "STANDARD", processingMs: number): boolean {
  const slaMs = lane === "CRITICAL" ? PROJ_STALE_CRITICAL_MS : PROJ_STALE_STANDARD_MS;
  if (processingMs > slaMs) {
    logger.warn("FUNNEL: SLA breach", {
      lane,
      processingMs,
      slaMs,
      structuredData: true,
    });
    return false;
  }
  return true;
}
