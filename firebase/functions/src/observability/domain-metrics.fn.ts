/**
 * domain-metrics.fn.ts — VS9 Observability · Domain Metrics
 *
 * Tracks across the event pipeline:
 *   - IER Lane Throughput / Latency
 *   - FUNNEL Lane processing time
 *   - OUTBOX_RELAY lag [R1]
 *   - RATE_LIMIT hit / CIRCUIT open
 * [R8]  每條記錄必須帶 traceId
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

interface MetricEvent {
  readonly metricType:
    | "IER_THROUGHPUT"
    | "IER_LATENCY"
    | "FUNNEL_PROCESSING"
    | "RELAY_LAG"
    | "RATE_LIMIT_HIT"
    | "CIRCUIT_OPEN"
    | "CIRCUIT_HALF_OPEN"
    | "CLAIMS_REFRESH_SUCCESS";
  readonly lane?: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly traceId?: string; // [R8]
  readonly valueMs?: number;
  readonly labels?: Record<string, string>;
}

/**
 * domain-metrics collector
 * Receives metric events from IER, FUNNEL, RELAY, CBG, and persists them.
 */
export const domainMetrics = onRequest(
  { region: "asia-east1", maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const metric = req.body as MetricEvent;

    if (!metric?.metricType) {
      res.status(400).json({ error: "metricType is required" });
      return;
    }

    const db = getFirestore();

    logger.info("DOMAIN_METRICS: recording", {
      metricType: metric.metricType,
      lane: metric.lane,
      traceId: metric.traceId, // [R8]
      valueMs: metric.valueMs,
      structuredData: true,
    });

    // Append metric to time-series collection
    await db.collection("domain-metrics").add({
      metricType: metric.metricType,
      lane: metric.lane ?? null,
      traceId: metric.traceId ?? null, // [R8]
      valueMs: metric.valueMs ?? null,
      labels: metric.labels ?? {},
      recordedAt: Timestamp.now(),
    });

    // Update rolling counter per metric type
    await db
      .collection("domain-metrics-summary")
      .doc(metric.metricType)
      .set(
        {
          count: FieldValue.increment(1),
          lastUpdatedAt: Timestamp.now(),
          ...(metric.lane ? { [`${metric.lane}_count`]: FieldValue.increment(1) } : {}),
        },
        { merge: true }
      );

    res.status(202).json({ accepted: true, metricType: metric.metricType });
  }
);
