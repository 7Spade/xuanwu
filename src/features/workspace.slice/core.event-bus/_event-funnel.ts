/**
 * workspace-core.event-bus — _event-funnel.ts
 *
 * Re-exports the Event Funnel from its canonical location: `projection.bus`.
 *
 * Per logic-overview.md, EVENT_FUNNEL_INPUT belongs to the PROJECTION_LAYER subgraph,
 * not the WORKSPACE_CONTAINER. This file exists solely for backwards compatibility
 * with callers that import from `@/features/workspace-core.event-bus`.
 */
export {
  registerWorkspaceFunnel,
  registerOrganizationFunnel,
  replayWorkspaceProjections,
} from '@/features/projection.bus';
