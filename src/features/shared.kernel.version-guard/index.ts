/**
 * shared.kernel.version-guard — Public API
 *
 * SK_VERSION_GUARD [S2] — monotonic version protection for all Projection writes.
 *
 * Per logic-overview_v10.md [S2]:
 *   All Projection write paths reference this slice to enforce
 *   event.aggregateVersion > view.lastProcessedVersion before updating state.
 *   Generalizes Invariant #19 from eligible-view to ALL Projections.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

export type {
  VersionGuardInput,
  VersionGuardResult,
  ImplementsVersionGuard,
} from './version-guard';

export { applyVersionGuard, versionGuardAllows } from './version-guard';
