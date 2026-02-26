/**
 * infra.gateway-query — _registry.ts
 *
 * [GW] Query Gateway — unified read entry point. [Q8][P4][R7]
 *
 * Per logic-overview.md GW_QUERY:
 *   QGWAY        — read-model-registry: version comparison / snapshot routing
 *   QGWAY_SCHED  — → projection.org-eligible-member-view  [#14][#15][#16][P4][R7]
 *   QGWAY_NOTIF  — → projection.account-view             [#6 FCM Token]
 *   QGWAY_SCOPE  — → projection.workspace-scope-guard-view [#A9]
 *   QGWAY_WALLET — → projection.wallet-balance (STRONG_READ 回源 WALLET_AGG [Q8])
 *
 * Pre-registered routes mirror the v9 GW_QUERY subgraph.
 * Additional routes can be added via registerQuery (open registry).
 *
 * D5 — Wallet balance display reads from projection; transactional operations
 *      must use STRONG_READ back to WALLET_AGG.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Generic query handler: receives typed params, returns typed result. */
type QueryHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;

/** Metadata stored alongside each registered handler. */
interface RegistryEntry<TParams = unknown, TResult = unknown> {
  readonly handler: QueryHandler<TParams, TResult>;
  /** Optional description for observability / debugging. */
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// Registry (module-level singleton)
// ---------------------------------------------------------------------------

// Use unknown-bounded entry so we can store heterogeneous handlers without
// a type assertion on read — callers cast via the generic executeQuery<>.
const queryRegistry = new Map<string, RegistryEntry>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a query handler under a given name.
 *
 * Projection slices call this during module init to advertise their queries.
 * Returns an un-register function (useful in tests or hot-reload scenarios).
 *
 * @example
 * registerQuery(
 *   'org-eligible-members',
 *   (params: { orgId: string }) => getEligibleMembers(params.orgId),
 *   '[P4][R7] org-eligible-member-view'
 * );
 */
export function registerQuery<TParams, TResult>(
  name: string,
  handler: QueryHandler<TParams, TResult>,
  description?: string
): () => void {
  // Store with bounded unknown types; callers recover types via executeQuery<T>().
  const entry: RegistryEntry = { handler: handler as QueryHandler<unknown, unknown>, description };
  queryRegistry.set(name, entry);
  return () => {
    queryRegistry.delete(name);
  };
}

/**
 * Execute a registered query by name.
 *
 * @throws Error if no handler is registered for the given name.
 *
 * @example
 * const members = await executeQuery('org-eligible-members', { orgId });
 */
export async function executeQuery<TParams, TResult>(
  name: string,
  params: TParams
): Promise<TResult> {
  const entry = queryRegistry.get(name);
  if (!entry) {
    throw new Error(
      `[infra.gateway-query] No handler registered for query "${name}". ` +
        `Register it with registerQuery() before calling executeQuery().`
    );
  }
  return entry.handler(params) as Promise<TResult>;
}

/**
 * Returns the names of all currently registered queries.
 * Useful for observability / admin tooling.
 */
export function listRegisteredQueries(): ReadonlyArray<{
  name: string;
  description?: string;
}> {
  return Array.from(queryRegistry.entries()).map(([name, entry]) => ({
    name,
    description: entry.description,
  }));
}

// ---------------------------------------------------------------------------
// Pre-registered v9 routes (GW_QUERY subgraph)
// These are registered as placeholder pass-throughs so the registry is
// populated at startup. Actual implementations are provided by the
// corresponding projection slices at their init time via registerQuery().
// ---------------------------------------------------------------------------

/**
 * QGWAY_SCHED — org-eligible-member-view [#14][#15][#16][P4][R7]
 * Route key: 'org-eligible-members'
 */

/**
 * QGWAY_NOTIF — account-view [#6 FCM Token]
 * Route key: 'account-view'
 */

/**
 * QGWAY_SCOPE — workspace-scope-guard-view [#A9]
 * Route key: 'workspace-scope-guard'
 */

/**
 * QGWAY_WALLET — wallet-balance (STRONG_READ → WALLET_AGG [Q8][D5])
 * Route key: 'wallet-balance'
 */

export const QUERY_ROUTES = {
  /** [P4][R7] org-eligible-member-view — schedule eligibility */
  ORG_ELIGIBLE_MEMBERS: 'org-eligible-members',
  /** [#6] account-view — FCM token / user profile */
  ACCOUNT_VIEW: 'account-view',
  /** [#A9] workspace-scope-guard-view — scope resolution for CBG_AUTH */
  WORKSPACE_SCOPE_GUARD: 'workspace-scope-guard',
  /** [Q8][D5] wallet-balance — STRONG_READ back to WALLET_AGG */
  WALLET_BALANCE: 'wallet-balance',
} as const;

export type QueryRouteName = (typeof QUERY_ROUTES)[keyof typeof QUERY_ROUTES];
