/**
 * staleness-contract.ts — SK_STALENESS_CONTRACT constants [S4]
 *
 * [S4]  SLA numbers are FORBIDDEN in component/node text.
 *       Always reference these constants. Never hardcode 30000, 500, or 10000 ms.
 */

/** [S4] TAG_MAX_STALENESS: tag-derived data ≤ 30s */
export const TAG_MAX_STALENESS_MS = 30_000;

/** [S4] PROJ_STALE_CRITICAL: authorization/scheduling projections ≤ 500ms */
export const PROJ_STALE_CRITICAL_MS = 500;

/** [S4] PROJ_STALE_STANDARD: general projections ≤ 10s */
export const PROJ_STALE_STANDARD_MS = 10_000;
