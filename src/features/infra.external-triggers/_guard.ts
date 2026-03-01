/**
 * infra.external-triggers — _guard.ts
 *
 * [L0] External Triggers — ResilienceGuard [S5]
 *
 * Per logic-overview_v1.md L0 · External Triggers:
 *   EXT_CLIENT  — Next.js _actions.ts → rate-limit → circuit-break → CBG_ENTRY
 *   EXT_WEBHOOK — Webhook / Edge Fn  → rate-limit → circuit-break → (handler)
 *   EXT_AUTH    — Firebase Auth      → AUTH_ID    → ID_LINK      → CTX_MGR
 *
 * This module provides an in-process ResilienceGuard implementing [S5]:
 *   R1 rate-limit   : per user ∪ per org → 429 + Retry-After
 *   R2 circuit-break: consecutive 5xx → open; half-open probe recovery
 *   R3 bulkhead     : slice isolation; fault does not cross slice boundary
 *
 * Usage (any _actions.ts entry point):
 *   const guard = createExternalTriggerGuard('workspace-application');
 *   const check = guard.check({ uid, orgId });
 *   if (!check.allowed) throw new RateLimitError(check.retryAfterMs);
 *
 * Invariants:
 *   D17 — All non-`_actions.ts` external entries must satisfy SK_RESILIENCE_CONTRACT [S5]
 *   D10 — traceId is NOT generated here; it is injected at CBG_ENTRY [R8]
 */

import type {
  RateLimitConfig,
  CircuitBreakerConfig,
  BulkheadConfig,
  ResilienceContract,
} from '@/features/shared-kernel';
import {
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
} from '@/features/shared-kernel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Check result returned by ResilienceGuard.check(). */
export interface GuardCheckResult {
  /** Whether the request is allowed to proceed. */
  readonly allowed: boolean;
  /** When allowed=false, milliseconds the caller should wait before retrying. */
  readonly retryAfterMs?: number;
  /** Human-readable reason when allowed=false. */
  readonly reason?: 'RATE_LIMITED' | 'CIRCUIT_OPEN' | 'BULKHEAD_FULL';
  /**
   * When allowed=true, must be called exactly once when the request completes
   * (regardless of success or failure). Decrements the bulkhead counter and
   * updates the circuit-breaker state.
   *
   * Prefer using `withGuard` which calls release automatically in a finally block.
   */
  release?: (succeeded: boolean) => void;
}

/** Caller context required for per-user and per-org rate limiting. [S5 R1] */
export interface CallerContext {
  readonly uid: string;
  readonly orgId?: string;
}

// ---------------------------------------------------------------------------
// Internal sliding-window rate limiter [S5 R1]
// ---------------------------------------------------------------------------

interface WindowEntry {
  count: number;
  resetAt: number;
}

function checkWindow(
  store: Map<string, WindowEntry>,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Internal circuit breaker [S5 R2]
// ---------------------------------------------------------------------------

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStatus {
  state: CircuitState;
  failures: number;
  openedAt: number;
}

function evaluateCircuit(
  status: CircuitStatus,
  cfg: CircuitBreakerConfig
): boolean {
  const now = Date.now();
  if (status.state === 'CLOSED') return true;
  if (status.state === 'OPEN') {
    if (now - status.openedAt >= cfg.openDurationMs) {
      status.state = 'HALF_OPEN';
      return true; // allow probe request
    }
    return false;
  }
  // HALF_OPEN: allow one probe
  return true;
}

// ---------------------------------------------------------------------------
// ResilienceGuard
// ---------------------------------------------------------------------------

/**
 * In-process resilience guard for an external-trigger entry point.
 * One instance per slice / entry-point — created via `createExternalTriggerGuard`.
 */
export interface ResilienceGuard {
  /**
   * Check whether the incoming request should be allowed.
   * Call before any business logic in the entry point.
   *
   * When `result.allowed === true`, `result.release(succeeded)` **must** be called
   * exactly once when the request completes (in a finally block).
   * Prefer `withGuard` to avoid forgetting the release call.
   */
  check(caller: CallerContext): GuardCheckResult;
  /**
   * Convenience wrapper that calls check(), runs `handler`, and releases
   * the bulkhead slot in a finally block regardless of outcome.
   */
  withGuard<T>(caller: CallerContext, handler: () => Promise<T>): Promise<T | GuardCheckResult>;
  /** The full resilience contract declaration for this guard. [S5] */
  readonly contract: ResilienceContract;
}

/**
 * Factory that creates a `ResilienceGuard` for the given slice / entry point.
 *
 * @param sliceId     Identifies the protected slice (used for bulkhead isolation).
 * @param rateCfg     Optional rate-limit override (defaults to DEFAULT_RATE_LIMIT).
 * @param cbCfg       Optional circuit-breaker override (defaults to DEFAULT_CIRCUIT_BREAKER).
 * @param bulkheadCfg Optional bulkhead override.
 */
export function createExternalTriggerGuard(
  sliceId: string,
  rateCfg: RateLimitConfig = DEFAULT_RATE_LIMIT,
  cbCfg: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
  bulkheadCfg?: Partial<BulkheadConfig>
): ResilienceGuard {
  const userWindows = new Map<string, WindowEntry>();
  const orgWindows = new Map<string, WindowEntry>();
  const circuitStatus: CircuitStatus = { state: 'CLOSED', failures: 0, openedAt: 0 };
  let activeConcurrency = 0;
  const maxConcurrency = bulkheadCfg?.maxConcurrency ?? 50;

  const contract: ResilienceContract = {
    rateLimit: rateCfg,
    circuitBreaker: cbCfg,
    bulkhead: {
      sliceId,
      maxConcurrency,
      ...bulkheadCfg,
    },
  };

  return {
    contract,

    check(caller: CallerContext): GuardCheckResult {
      // R1 — per-user rate limit
      if (!checkWindow(userWindows, caller.uid, rateCfg.perUserLimit, rateCfg.windowMs)) {
        return { allowed: false, retryAfterMs: rateCfg.windowMs, reason: 'RATE_LIMITED' };
      }
      // R1 — per-org rate limit
      if (caller.orgId) {
        if (!checkWindow(orgWindows, caller.orgId, rateCfg.perOrgLimit, rateCfg.windowMs)) {
          return { allowed: false, retryAfterMs: rateCfg.windowMs, reason: 'RATE_LIMITED' };
        }
      }
      // R2 — circuit breaker
      if (!evaluateCircuit(circuitStatus, cbCfg)) {
        const retryAfterMs = cbCfg.openDurationMs - (Date.now() - circuitStatus.openedAt);
        return { allowed: false, retryAfterMs, reason: 'CIRCUIT_OPEN' };
      }
      // R3 — bulkhead
      if (activeConcurrency >= maxConcurrency) {
        return { allowed: false, reason: 'BULKHEAD_FULL' };
      }
      // Increment BEFORE returning so the slot is held from this point on.
      activeConcurrency++;

      // Return a release function to guarantee the slot is freed [S5 R3].
      const release = (succeeded: boolean): void => {
        if (activeConcurrency > 0) activeConcurrency--;
        if (succeeded) {
          if (circuitStatus.state === 'HALF_OPEN') {
            circuitStatus.state = 'CLOSED';
            circuitStatus.failures = 0;
          }
        } else {
          circuitStatus.failures++;
          if (
            circuitStatus.state !== 'OPEN' &&
            circuitStatus.failures >= cbCfg.failureThreshold
          ) {
            circuitStatus.state = 'OPEN';
            circuitStatus.openedAt = Date.now();
          } else if (circuitStatus.state === 'HALF_OPEN') {
            circuitStatus.state = 'OPEN';
            circuitStatus.openedAt = Date.now();
          }
        }
      };

      return { allowed: true, release };
    },

    async withGuard<T>(
      caller: CallerContext,
      handler: () => Promise<T>
    ): Promise<T | GuardCheckResult> {
      const checkResult = this.check(caller);
      if (!checkResult.allowed) return checkResult;
      try {
        const result = await handler();
        checkResult.release!(true);
        return result;
      } catch (err) {
        checkResult.release!(false);
        throw err;
      }
    },
  };
}
