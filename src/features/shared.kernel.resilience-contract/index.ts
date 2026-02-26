/**
 * shared.kernel.resilience-contract — Public API
 *
 * SK_RESILIENCE_CONTRACT [S5] — minimum resilience spec for all external entry points.
 *
 * Per logic-overview_v10.md [S5]:
 *   R1 rate-limit (per user ∪ per org → 429 + retry-after)
 *   R2 circuit-break (5 consecutive 5xx → open; half-open probe recovery)
 *   R3 bulkhead (slice isolation; fault containment)
 *
 * Applies to: _actions.ts / Webhook / Edge Function (all paths before CBG_ENTRY).
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

export type {
  RateLimitConfig,
  CircuitBreakerConfig,
  BulkheadConfig,
  ResilienceContract,
  ImplementsResilienceContract,
} from './resilience-contract';

export {
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
} from './resilience-contract';
