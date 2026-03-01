/**
 * types.ts — Shared Firebase Functions types
 *
 * Single source of truth for EventEnvelope and related contracts.
 * Import from here instead of defining locally per function module.
 */

import { Timestamp } from "firebase-admin/firestore";

/** [R8] EventEnvelope: traceId injected ONCE at CBG_ENTRY, never overwritten */
export interface EventEnvelope {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  /** [R8] Injected once at CBG_ENTRY. NEVER regenerate or overwrite in downstream nodes. */
  readonly traceId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly idempotencyKey: string;
  readonly lane: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly dlqTier: "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
  readonly createdAt: Timestamp;
}

/** [S1] DLQ tier enum */
export type DlqTier = "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";

/** [S1] DLQ collection name mapping — single source of truth */
export function dlqCollectionName(tier: DlqTier): string {
  const map: Record<DlqTier, string> = {
    SAFE_AUTO:       "dlq-safe-auto",
    REVIEW_REQUIRED: "dlq-review-required",
    SECURITY_BLOCK:  "dlq-security-block",
  };
  return map[tier];
}
