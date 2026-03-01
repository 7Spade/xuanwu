/**
 * shared.kernel/version-guard — SK_VERSION_GUARD [S2]
 *
 * VS0 Shared Kernel: Monotonic version protection for all Projection writes.
 *
 * Per logic-overview.md [S2]:
 *   All Projection write paths MUST apply this guard before updating state:
 *     event.aggregateVersion > view.lastProcessedVersion → allow write
 *     otherwise → discard (stale or duplicate event; MUST NOT overwrite newer state)
 *
 * Generalization of Invariant #19: applies to ALL Projections, not only eligible-view.
 * FUNNEL compose-time must reference this rule uniformly.
 *
 * Consumers: every projection sub-dir inside projection.bus.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

// ─── Contract types ───────────────────────────────────────────────────────────

/** Input to the version guard check. [S2] */
export interface VersionGuardInput {
  /** aggregateVersion carried by the incoming event. */
  readonly eventVersion: number;
  /** lastProcessedVersion currently stored in the Projection view. */
  readonly viewLastProcessedVersion: number;
}

/** Result of the version guard decision. [S2] */
export type VersionGuardResult = 'allow' | 'discard';

// ─── Guard function ───────────────────────────────────────────────────────────

/**
 * Apply SK_VERSION_GUARD to an incoming event. [S2]
 *
 * Returns 'allow' when eventVersion is STRICTLY GREATER than the stored version.
 * Returns 'discard' for equal (duplicate) or lesser (out-of-order late delivery) versions.
 */
export function applyVersionGuard(input: VersionGuardInput): VersionGuardResult {
  return input.eventVersion > input.viewLastProcessedVersion ? 'allow' : 'discard';
}

/** Boolean convenience wrapper for applyVersionGuard. */
export function versionGuardAllows(input: VersionGuardInput): boolean {
  return applyVersionGuard(input) === 'allow';
}

// ─── Conformance marker ───────────────────────────────────────────────────────

/**
 * Marker interface — Projection implementations declare conformance to SK_VERSION_GUARD. [S2]
 */
export interface ImplementsVersionGuard {
  readonly implementsVersionGuard: true;
}
