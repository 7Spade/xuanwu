/**
 * infra.external-triggers — Public API
 *
 * [L0] External Triggers — 外部觸發入口應用層模組 [S5]
 *
 * Per logic-overview_v1.md L0 · External Triggers:
 *   所有命令寫入路徑在到達 CBG_ENTRY 前，必須通過：
 *     rate-limiter → circuit-breaker → bulkhead
 *
 * Three external trigger entry types (L0):
 *
 *   ① EXT_CLIENT  — Next.js Server Actions (`_actions.ts`)
 *     Location:   src/features/{slice}/_actions.ts  (distributed, per VSA)
 *     Compliance: [S5] use `createExternalTriggerGuard` from this module
 *     Rule:       D17 — all _actions.ts must declare ResilienceContract conformance
 *
 *   ② EXT_AUTH    — Firebase Auth entry (登入 / 註冊 / Token)
 *     Location:   src/shared/infra/auth/auth.adapter.ts  (FIREBASE_ACL)
 *     Compliance: Handled by FIREBASE_ACL adapter; no separate S5 guard needed
 *     Rule:       D24 — only auth.adapter.ts may call firebase/auth
 *
 *   ③ EXT_WEBHOOK — Webhook / Edge Function
 *     Location:   firebase/functions/src/gateway/webhook.fn.ts  (Cloud Function)
 *     Compliance: [S5] rate-limit + HMAC signature verification built in
 *     Rule:       D17 — must satisfy SK_RESILIENCE_CONTRACT [S5]
 *
 * Design Location Summary (mirrors firebase-structure.md):
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │ EXT_CLIENT  (app-layer resilience guard)                                   │
 * │   → src/features/infra.external-triggers/  (this module)                  │
 * │                                                                            │
 * │ EXT_AUTH    (FIREBASE_ACL boundary)                                        │
 * │   → src/shared/infra/auth/auth.adapter.ts                                  │
 * │                                                                            │
 * │ EXT_WEBHOOK (Cloud Function entry)                                         │
 * │   → firebase/functions/src/gateway/webhook.fn.ts                          │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Usage (in any _actions.ts):
 *   import { createExternalTriggerGuard } from '@/features/infra.external-triggers';
 *
 *   const guard = createExternalTriggerGuard('workspace-application');
 *
 *   export async function myAction(...): Promise<CommandResult> {
 *     return guard.withGuard({ uid, orgId }, async () => {
 *       return dispatchCommand(...);
 *     });
 *   }
 */

export { createExternalTriggerGuard } from './_guard';
export type {
  ResilienceGuard,
  GuardCheckResult,
  CallerContext,
} from './_guard';
