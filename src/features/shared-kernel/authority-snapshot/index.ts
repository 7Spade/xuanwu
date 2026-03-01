/**
 * shared.kernel/authority-snapshot — SK_AUTH_SNAP
 *
 * VS0 Shared Kernel: Authority snapshot contract.
 *
 * Per logic-overview.md:
 *   SK_AUTH_SNAP["authority-snapshot\nclaims / roles / scopes\nTTL = Token 有效期"]
 *
 * The AuthoritySnapshot is a point-in-time capture of an account's effective
 * roles and permissions. Its TTL equals the Firebase Token validity period.
 *
 * Implemented by:
 *   — projection.workspace-scope-guard  [#A9] critical path; STRONG_READ
 *   — projection.account-view           [#8]  general authority snapshot
 *
 * Consumers MUST use SK_READ_CONSISTENCY [S3] to choose between the live
 * Aggregate (STRONG_READ) and the Projection snapshot (EVENTUAL_READ).
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Core contract ────────────────────────────────────────────────────────────

/**
 * Point-in-time authority snapshot for a subject (account).
 *
 * Lifetime: equal to the Firebase Token validity period (TTL).
 * After expiry consumers must force a token refresh [S6].
 */
export interface AuthoritySnapshot {
  /** Subject identifier (accountId / userId) this snapshot describes. */
  readonly subjectId: string;
  /** Roles currently held by this subject in the active context. */
  readonly roles: readonly string[];
  /** Scoped permissions derived from roles at snapshot time. */
  readonly permissions: readonly string[];
  /** ISO 8601 timestamp when this snapshot was last computed. */
  readonly snapshotAt: string;
  /** Read-model version from which this snapshot was built. [S2] */
  readonly readModelVersion: number;
}

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — Projection implementations that expose an AuthoritySnapshot
 * must declare conformance to this contract. [#8]
 */
export interface ImplementsAuthoritySnapshotContract {
  readonly implementsAuthoritySnapshot: true;
}
