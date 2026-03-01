/**
 * shared.kernel/resilience-contract — SK_RESILIENCE_CONTRACT [S5]
 *
 * VS0 Shared Kernel: Minimum resilience specification for all external entry points.
 *
 * Per logic-overview.md [S5]:
 *   R1 rate-limit:     per user ∪ per org — exceeded → 429 + Retry-After header
 *   R2 circuit-break:  5 consecutive 5xx → open circuit; half-open probe recovery
 *   R3 bulkhead:       slice isolation — a fault MUST NOT propagate across slice boundaries
 *
 * Applies to: _actions.ts / Webhook / Edge Function — any path reaching CBG_ENTRY.
 *
 * Rule: This is a CONTRACT (types + constants), not a runtime implementation.
 *   Each entry-point declares conformance; implementation lives in infra.external-triggers.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Rate limit [R1] ──────────────────────────────────────────────────────────

/**
 * Rate limit configuration for a single entry point. [S5 R1]
 *
 * Both per-user and per-org limits must pass; exceeded → HTTP 429.
 */
export interface RateLimitConfig {
  readonly perUserLimit: number;
  readonly perOrgLimit: number;
  /** Time window in milliseconds. */
  readonly windowMs: number;
}

// ─── Circuit breaker [R2] ─────────────────────────────────────────────────────

/**
 * Circuit breaker configuration. [S5 R2]
 *
 * `failureThreshold` consecutive 5xx errors open the circuit.
 * After `openDurationMs` the circuit transitions to half-open for probe recovery.
 */
export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly openDurationMs: number;
}

// ─── Bulkhead [R3] ────────────────────────────────────────────────────────────

/**
 * Bulkhead configuration. [S5 R3]
 *
 * Slice-level concurrency isolation: a fault or overload in one slice
 * MUST NOT cascade into other slices.
 */
export interface BulkheadConfig {
  readonly sliceId: string;
  readonly maxConcurrency: number;
}

// ─── Full declaration ─────────────────────────────────────────────────────────

/**
 * Complete resilience contract declaration for an entry point. [S5]
 *
 * Each external trigger path MUST declare a ResilienceContract.
 */
export interface ResilienceContract {
  readonly rateLimit: RateLimitConfig;
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly bulkhead: BulkheadConfig;
}

// ─── Recommended defaults ─────────────────────────────────────────────────────

/** Default rate limit for standard Server Action entry points. [S5 R1] */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  perUserLimit: 100,
  perOrgLimit:  1_000,
  windowMs:     60_000,
} as const;

/** Default circuit breaker configuration. [S5 R2] */
export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  openDurationMs:   30_000,
} as const;

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — entry-point files declare SK_RESILIENCE_CONTRACT conformance. [S5]
 */
export interface ImplementsResilienceContract {
  readonly implementsResilienceContract: true;
}
