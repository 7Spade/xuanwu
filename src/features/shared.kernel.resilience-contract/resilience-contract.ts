/**
 * shared.kernel.resilience-contract — SK_RESILIENCE_CONTRACT [S5]
 *
 * Per logic-overview_v10.md [S5]:
 *   所有外部觸發入口的最低防護規格（不是 GW 內部實作細節）
 *
 *   R1 rate-limit：per user ∪ per org，超限 429 + retry-after header
 *   R2 circuit-break：連續 5xx → 熔斷，半開探針恢復
 *   R3 bulkhead：切片隔板，故障不跨切片傳播
 *
 *   適用範圍：_actions.ts / Webhook / Edge Function
 *   所有觸達 CBG_ENTRY 之前的路徑
 *
 * This is a CONTRACT (types + constants) — not a runtime implementation.
 * Each entry-point slice references this contract to declare conformance.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/**
 * Rate limit configuration per entry point. [S5 R1]
 *
 * Limits apply per-user AND per-org (both must pass).
 * Exceeded → HTTP 429 + Retry-After header.
 */
export interface RateLimitConfig {
  /** Maximum requests per user per window. */
  readonly perUserLimit: number;
  /** Maximum requests per org per window. */
  readonly perOrgLimit: number;
  /** Window duration in milliseconds. */
  readonly windowMs: number;
}

/**
 * Circuit breaker configuration. [S5 R2]
 *
 * Consecutive 5xx errors → open circuit (熔斷).
 * Half-open probe → gradual recovery.
 */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit. */
  readonly failureThreshold: number;
  /** Duration (ms) the circuit stays open before attempting half-open probe. */
  readonly openDurationMs: number;
}

/**
 * Bulkhead configuration. [S5 R3]
 *
 * Slice-level isolation — a fault in one slice must not propagate to others.
 */
export interface BulkheadConfig {
  /** Identifier of the slice this bulkhead protects. */
  readonly sliceId: string;
  /** Maximum concurrent requests for this slice. */
  readonly maxConcurrency: number;
}

/**
 * Full resilience contract declaration for an entry point. [S5]
 *
 * Every external trigger path (_actions.ts / Webhook / Edge) must declare this.
 */
export interface ResilienceContract {
  readonly rateLimit: RateLimitConfig;
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly bulkhead: BulkheadConfig;
}

/**
 * Default rate limit configuration for standard action entry points. [S5 R1]
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  perUserLimit: 100,
  perOrgLimit: 1_000,
  windowMs: 60_000,
} as const;

/**
 * Default circuit breaker configuration. [S5 R2]
 */
export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  openDurationMs: 30_000,
} as const;

/**
 * Marker interface — entry-point files declare SK_RESILIENCE_CONTRACT conformance. [S5]
 */
export interface ImplementsResilienceContract {
  readonly implementsResilienceContract: true;
}
