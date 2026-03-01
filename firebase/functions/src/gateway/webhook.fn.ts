/**
 * webhook.fn.ts — Webhook / Edge Function Entry Point
 *
 * [S5]  遵守 SK_RESILIENCE_CONTRACT: rate-limit / circuit-break / bulkhead
 * [R8]  traceId 必須從入站 header 傳入或在此生成後全鏈傳遞（唯讀）
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { randomUUID } from "crypto";

/**
 * Webhook entry point — receives external event callbacks
 * (e.g., payment processor callbacks, third-party integrations)
 * POST /webhook  body: { source, eventType, data }
 */
export const webhook = onRequest(
  { region: "asia-east1", maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    // [R8] Inject traceId at entry; propagate read-only downstream
    const traceId: string = (req.headers["x-trace-id"] as string) || randomUUID();

    const signature = req.headers["x-webhook-signature"] as string | undefined;
    if (!signature) {
      res.status(401).json({ error: "Missing webhook signature" });
      return;
    }

    // TODO: verify HMAC signature against shared secret
    // TODO: [S5] apply rate-limit per source identifier
    // TODO: [S5] circuit-break on consecutive failures

    const { source, eventType, data } = req.body as {
      source?: string;
      eventType?: string;
      data?: unknown;
    };

    if (!source || !eventType) {
      res.status(400).json({ error: "source and eventType are required" });
      return;
    }

    logger.info("WEBHOOK_ENTRY", {
      traceId,
      source,
      eventType,
      structuredData: true,
    });

    void data; // forwarded to command router (TODO)

    // TODO: route to command-gateway CBG_ENTRY with injected traceId
    res.status(202).json({ accepted: true, traceId });
  }
);
