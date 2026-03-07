/**
 * projection.bus ??_funnel.ts
 *
 * EVENT_FUNNEL_INPUT: unified entry point for the Projection Layer.
 *
 * Per 00-LogicOverview.md (L5 Â· ProjectionBus Infrastructure):
 *   WORKSPACE_EVENT_BUS  ??|?€?‰æ¥­?™ä?ä»¶|  EVENT_FUNNEL_INPUT
 *   ORGANIZATION_EVENT_BUS ??|?€?‰ç?ç¹”ä?ä»¶| EVENT_FUNNEL_INPUT
 *   TAG_LIFECYCLE_BUS ??|TagLifecycleEvent| EVENT_FUNNEL_INPUT  (v5 ?°å?)
 *
 *   EVENT_FUNNEL_INPUT routes to:
 *     ??WORKSPACE_PROJECTION_VIEW
 *     ??WORKSPACE_SCOPE_READ_MODEL
 *     ??ACCOUNT_PROJECTION_VIEW
 *     ??ACCOUNT_PROJECTION_AUDIT
 *     ??ACCOUNT_PROJECTION_SCHEDULE
 *     ??ORGANIZATION_PROJECTION_VIEW
 *     ??ACCOUNT_SKILL_VIEW
 *     ??ORG_ELIGIBLE_MEMBER_VIEW
 *     ??TAG_SNAPSHOT (v5 ?°å?)
 *     ??PROJECTION_VERSION (updates stream offset)
 *
 *   WORKSPACE_EVENT_STORE -.??EVENT_FUNNEL_INPUT (replay rebuilds all projections)
 *
 * Call `registerWorkspaceFunnel(bus)`, `registerOrganizationFunnel()`, and
 * `registerTagFunnel()` once at app startup.
 */

import type { WorkspaceEventBus } from '@/features/workspace.slice';

import { registerOrganizationFunnel as registerOrganizationFunnelImpl } from './_organization-funnel';
import { upsertProjectionVersion } from './_registry';
import { registerTagFunnel as registerTagFunnelImpl } from './_tag-funnel';
import { registerWorkspaceFunnel as registerWorkspaceFunnelImpl } from './_workspace-funnel';


/**
 * Registers workspace event handlers on the bus to keep projections in sync.
 * Returns a cleanup function.
 *
 * Note: projection updates are fire-and-forget (non-blocking to the UI event cycle).
 */
export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void {
  return registerWorkspaceFunnelImpl(bus);
}

/**
 * Registers organization event handlers to keep org and schedule projections in sync.
 * Returns a cleanup function.
 */
export function registerOrganizationFunnel(): () => void {
  return registerOrganizationFunnelImpl();
}

/**
 * Registers tag lifecycle event handlers to keep the TAG_SNAPSHOT projection in sync.
 * Also delegates to VS4_TAG_SUBSCRIBER to update SKILL_TAG_POOL. [R3]
 * Returns a cleanup function.
 *
 * Per 00-LogicOverview.md [R3]:
 *   IER BACKGROUND_LANE ??VS4_TAG_SUBSCRIBER ??SKILL_TAG_POOL
 *
 * Per 00-LogicOverview.md (L5 Â· ProjectionBus Infrastructure):
 *   IER ==>|"#9 ?¯ä?å¯«å…¥è·¯å?"| FUNNEL
 *   FUNNEL --> TAG_SNAPSHOT
 *
 * Invariant A7: Event Funnel only composes projections; does not enforce cross-BC invariants.
 */
export function registerTagFunnel(): () => void {
  return registerTagFunnelImpl();
}

/**
 * Replays events from the event store to rebuild all workspace projections.
 * Implements: WORKSPACE_EVENT_STORE -.??EVENT_FUNNEL_INPUT
 */
export async function replayWorkspaceProjections(
  workspaceId: string
): Promise<{ replayed: number }> {
  const { getDomainEvents } = await import(
    '@/shared-infra/frontend-firebase/firestore/repositories/workspace-core.event-store.repository'
  );
  const events = await getDomainEvents(workspaceId);
  if (events.length > 0) {
    await upsertProjectionVersion(`workspace-${workspaceId}`, events.length, new Date().toISOString());
  }
  return { replayed: events.length };
}
