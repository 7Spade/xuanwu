/**
 * projection.bus — Public API
 *
 * VS8 Projection Bus: the unified entry point and version registry for the
 * Projection Layer.
 *
 * Nodes:
 *   - EVENT_FUNNEL_INPUT: routes events from all buses to individual projection handlers
 *   - PROJECTION_VERSION: event stream offset + read-model version table
 *   - READ_MODEL_REGISTRY: query handler registration for infra.gateway-query
 *
 * Per logic-overview.md (VS8 Projection Bus):
 *   WORKSPACE_EVENT_BUS + ORGANIZATION_EVENT_BUS + TAG_LIFECYCLE_BUS
 *     → EVENT_FUNNEL_INPUT → all projection slices
 *
 * Consumers call once at app startup:
 *   registerWorkspaceFunnel(bus)
 *   registerOrganizationFunnel()
 *   registerTagFunnel()
 *   registerAllQueryHandlers()
 */

// =================================================================
// Event Funnel (EVENT_FUNNEL_INPUT — sole projection write path #9)
// =================================================================
export {
  registerWorkspaceFunnel,
  registerOrganizationFunnel,
  registerTagFunnel,
  replayWorkspaceProjections,
} from './_funnel';

// =================================================================
// Projection Registry (PROJECTION_VERSION — event stream offset)
// =================================================================
export {
  getProjectionVersion,
  upsertProjectionVersion,
  type ProjectionVersionRecord,
} from './_registry';

// =================================================================
// Query Registration (READ_MODEL_REGISTRY — GW_QUERY routes)
// =================================================================
export { registerAllQueryHandlers } from './_query-registration';
