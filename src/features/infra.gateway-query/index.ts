/**
 * infra.gateway-query — Public API
 *
 * [GW] 查詢閘道器 (Query Registry)
 *
 * Per tree.md: infra.gateway-query = Query Gateway
 *   — Registry of all registered read-model queries.
 *   — Routes query requests to the correct projection slice.
 *   — Enforces read-side authorization.
 *
 * TODO: Implement query registry with projection routing.
 *
 * Consumers:
 *   - src/app Server Components (data fetching through here)
 *   - projection.* slices register their query handlers here
 */

// Placeholder — implementation pending.
// Once implemented, export: registerQuery, executeQuery, type QueryHandler
export {};
