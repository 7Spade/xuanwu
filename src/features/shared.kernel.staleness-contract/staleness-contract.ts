/**
 * shared.kernel.staleness-contract — SK_STALENESS_CONTRACT [S4]
 *
 * Per logic-overview_v10.md [S4]:
 *   全系統 Staleness SLA 常數（單一真相來源）
 *
 *   TAG_MAX_STALENESS    ≤ 30s   — tag 派生資料（SKILL_TAG_POOL / TAG_SNAPSHOT）
 *   PROJ_STALE_CRITICAL  ≤ 500ms — 授權/排班 Projection (WS_SCOPE_VIEW / ORG_ELIGIBLE_VIEW)
 *   PROJ_STALE_STANDARD  ≤ 10s   — 一般 Projection
 *
 * v9 problem: "Max Staleness ≤ 30s" was written in three places:
 *   TAG_STALE_GUARD (VS0), SKILL_TAG_POOL (VS4), TAG_SNAPSHOT (VS8)
 *
 * All consumer nodes MUST reference this slice — do NOT hardcode SLA values locally.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/** All staleness SLA values in milliseconds. [S4] */
export const StalenessMs = {
  /**
   * Maximum allowed staleness for all tag-derived data.
   * Applies to: SKILL_TAG_POOL, TAG_SNAPSHOT, TAG_STALE_GUARD.
   * [SK_STALENESS_CONTRACT: TAG_MAX_STALENESS ≤ 30s]
   */
  TAG_MAX_STALENESS: 30_000,

  /**
   * Maximum allowed staleness for authorization/scheduling Projections.
   * Applies to: WS_SCOPE_VIEW, ORG_ELIGIBLE_VIEW.
   * [SK_STALENESS_CONTRACT: PROJ_STALE_CRITICAL ≤ 500ms]
   */
  PROJ_STALE_CRITICAL: 500,

  /**
   * Maximum allowed staleness for general Projections.
   * [SK_STALENESS_CONTRACT: PROJ_STALE_STANDARD ≤ 10s]
   */
  PROJ_STALE_STANDARD: 10_000,
} as const;

/** Staleness tier classification. [S4] */
export type StalenessTier = 'TAG' | 'CRITICAL' | 'STANDARD';

/**
 * Retrieve the SLA threshold (ms) for a given staleness tier. [S4]
 */
export function getSlaMs(tier: StalenessTier): number {
  switch (tier) {
    case 'TAG':
      return StalenessMs.TAG_MAX_STALENESS;
    case 'CRITICAL':
      return StalenessMs.PROJ_STALE_CRITICAL;
    case 'STANDARD':
      return StalenessMs.PROJ_STALE_STANDARD;
  }
}

/**
 * Check whether the given age (ms) exceeds the SLA for a tier. [S4]
 */
export function isStale(ageMs: number, tier: StalenessTier): boolean {
  return ageMs > getSlaMs(tier);
}

/**
 * Marker interface — consumer nodes declare their staleness tier. [S4]
 */
export interface ImplementsStalenessContract {
  readonly stalenessTier: StalenessTier;
}
