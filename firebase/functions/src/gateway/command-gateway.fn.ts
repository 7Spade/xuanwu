/**
 * command-gateway.fn.ts — CBG_ENTRY (L2 Command Gateway)
 *
 * [R8]  TraceID 在此處注入一次，全鏈唯讀不可覆蓋
 * [S5]  遵守 SK_RESILIENCE_CONTRACT: rate-limit / circuit-break / bulkhead
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { randomUUID } from "crypto";

/** SK_CMD_RESULT contract shape */
interface CommandSuccess {
  readonly success: true;
  readonly aggregateId: string;
  readonly version: number;
}

interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly aggregateId?: string;
}

interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}

type CommandResult = CommandSuccess | CommandFailure;

/** Simple in-process rate-limit counter (replace with Redis/Firestore in prod) */
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now >= entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

/**
 * unified-command-gateway
 * CBG_ENTRY: injects traceId → event-envelope [R8]
 * POST /command-gateway  body: { aggregateType, command, payload }
 */
export const commandGateway = onRequest(
  { region: "asia-east1", maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    // [R8] TraceID injected ONCE at CBG_ENTRY
    const traceId: string = (req.headers["x-trace-id"] as string) || randomUUID();

    // [S5] Rate limit per user / per org
    const uid: string = (req.headers["x-uid"] as string) || "anonymous";
    const orgId: string = (req.headers["x-org-id"] as string) || "";
    if (!checkRateLimit(uid) || (orgId && !checkRateLimit(orgId))) {
      res.status(429).set("Retry-After", "60").json({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      } satisfies CommandFailure);
      return;
    }

    const { aggregateType, command, payload } = req.body as {
      aggregateType?: string;
      command?: string;
      payload?: unknown;
    };

    if (!aggregateType || !command) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_COMMAND", message: "aggregateType and command are required" },
      } satisfies CommandFailure);
      return;
    }

    logger.info("CBG_ENTRY", {
      traceId,
      uid,
      aggregateType,
      command,
      structuredData: true,
    });

    // TODO: authority-interceptor → authority-snapshot validation
    // TODO: command-router → route to VS1/VS2/VS3/VS4/VS5/VS6 slice handlers

    const result: CommandResult = {
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: `Command '${command}' on '${aggregateType}' is not yet routed`,
      },
    };

    void payload; // consumed by router (TODO)

    res.status(501).json({ ...result, traceId });
  }
);
