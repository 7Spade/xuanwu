/**
 * shared.kernel/staleness-contract — SK_STALENESS_CONTRACT [S4]
 *
 * VS0 Shared Kernel: Global staleness SLA — single source of truth.
 *
 * Per logic-overview.md [S4]:
 *   TAG_MAX_STALENESS    ≤ 30 s   — tag-derived data (SKILL_TAG_POOL, TAG_SNAPSHOT)
 *   PROJ_STALE_CRITICAL  ≤ 500 ms — authorization / scheduling Projections
 *   PROJ_STALE_STANDARD  ≤ 10 s   — general Projections
 *   PROJ_STALE_DEMAND_BOARD ≤ 5 s — Demand Board Projection
 *
 * Rule: ALL consumer nodes MUST reference `StalenessMs.*` from this contract.
 *   Direct numeric literals (e.g. `30000`, `500`) in staleness checks are FORBIDDEN.
 *   SLA numbers are FORBIDDEN in component/node text — use SK_STALENESS_CONTRACT constants.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── SLA constants ────────────────────────────────────────────────────────────

/**
 * All staleness SLA values in milliseconds. [S4]
 *
 * Single source of truth — do NOT hardcode these values anywhere else.
 */
export const StalenessMs = {
  /**
   * Tag-derived data maximum staleness.
   * Applies to: SKILL_TAG_POOL, TAG_SNAPSHOT, TAG_STALE_GUARD.
   */
  TAG_MAX_STALENESS: 30_000,

  /**
   * Authorization / scheduling Projection critical SLA.
   * Applies to: WS_SCOPE_VIEW, ORG_ELIGIBLE_VIEW.
   */
  PROJ_STALE_CRITICAL: 500,

  /**
   * General Projection SLA.
   * Applies to all Projections not covered by a stricter SLA.
   */
  PROJ_STALE_STANDARD: 10_000,

  /**
   * Demand Board Projection SLA.
   * Per docs/prd-schedule-workforce-skills.md NFR PROJ_STALE_DEMAND_BOARD.
   */
  PROJ_STALE_DEMAND_BOARD: 5_000,
} as const;

// ─── Tier classification ──────────────────────────────────────────────────────

/** Staleness tier used to look up the SLA constant. [S4] */
export type StalenessTier = 'TAG' | 'CRITICAL' | 'STANDARD' | 'DEMAND_BOARD';

/**
 * Returns the SLA threshold (ms) for a staleness tier. [S4]
 */
export function getSlaMs(tier: StalenessTier): number {
  switch (tier) {
    case 'TAG':          return StalenessMs.TAG_MAX_STALENESS;
    case 'CRITICAL':     return StalenessMs.PROJ_STALE_CRITICAL;
    case 'STANDARD':     return StalenessMs.PROJ_STALE_STANDARD;
    case 'DEMAND_BOARD': return StalenessMs.PROJ_STALE_DEMAND_BOARD;
  }
}

/**
 * Returns true when the measured age exceeds the SLA for the given tier. [S4]
 */
export function isStale(ageMs: number, tier: StalenessTier): boolean {
  return ageMs > getSlaMs(tier);
}

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — consumer nodes declare their staleness tier. [S4]
 */
export interface ImplementsStalenessContract {
  readonly stalenessTier: StalenessTier;
}
