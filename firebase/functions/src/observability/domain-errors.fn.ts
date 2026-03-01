/**
 * domain-errors.fn.ts — VS9 Observability · Domain Error Log
 *
 * Sources:
 *   - WS_TX_RUNNER errors
 *   - SCHEDULE_SAGA errors
 *   - DLQ_BLOCK security events [R5]
 *   - StaleTagWarning [S4]
 *   - TOKEN_REFRESH failures [S6]
 * [R8]  every error record MUST include traceId
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

type ErrorLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";
type ErrorSource =
  | "WS_TX_RUNNER"
  | "SCHEDULE_SAGA"
  | "DLQ_SECURITY_BLOCK"
  | "STALE_TAG_WARNING"
  | "TOKEN_REFRESH_FAILURE"
  | "GENERIC";

interface DomainErrorEvent {
  readonly level: ErrorLevel;
  readonly source: ErrorSource;
  /** [R8] traceId required on every error record */
  readonly traceId?: string;
  readonly aggregateId?: string;
  readonly eventType?: string;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * domain-error-log HTTP endpoint
 * Accepts error events from any domain node and persists them.
 */
export const domainErrors = onRequest(
  { region: "asia-east1", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const errorEvent = req.body as DomainErrorEvent;

    if (!errorEvent?.message || !errorEvent.source) {
      res.status(400).json({ error: "message and source are required" });
      return;
    }

    const db = getFirestore();

    const logEntry = {
      level: errorEvent.level ?? "ERROR",
      source: errorEvent.source,
      traceId: errorEvent.traceId ?? null, // [R8]
      aggregateId: errorEvent.aggregateId ?? null,
      eventType: errorEvent.eventType ?? null,
      message: errorEvent.message,
      details: errorEvent.details ?? null,
      recordedAt: Timestamp.now(),
    };

    if (errorEvent.level === "CRITICAL") {
      logger.error("DOMAIN_ERRORS: CRITICAL", logEntry);
    } else if (errorEvent.level === "ERROR") {
      logger.error("DOMAIN_ERRORS: ERROR", logEntry);
    } else {
      logger.warn("DOMAIN_ERRORS: WARN/INFO", logEntry);
    }

    await db.collection("domain-error-log").add(logEntry);

    res.status(202).json({ accepted: true });
  }
);

/**
 * domain-error-watcher: reacts to new CRITICAL entries in domain-error-log
 * Triggers alerts for critical errors (SECURITY_BLOCK, TOKEN_REFRESH failures, etc.)
 */
export const domainErrorWatcher = onDocumentCreated(
  { document: "domain-error-log/{docId}", region: "asia-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const entry = snapshot.data() as DomainErrorEvent & { level: ErrorLevel };

    if (entry.level !== "CRITICAL") return;

    logger.error("DOMAIN_ERRORS_WATCHER: CRITICAL error detected", {
      source: entry.source,
      traceId: entry.traceId, // [R8]
      aggregateId: entry.aggregateId,
      message: entry.message,
      structuredData: true,
    });

    // TODO: send alert via PagerDuty / Slack / email for CRITICAL events
    // Especially for: DLQ_SECURITY_BLOCK, TOKEN_REFRESH_FAILURE
  }
);
