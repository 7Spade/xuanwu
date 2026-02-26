/**
 * shared.kernel.version-guard — SK_VERSION_GUARD [S2]
 *
 * Per logic-overview.md [S2]:
 *   所有 Projection 消費事件時的防亂序全域原則（不限於 eligible-view）
 *
 *   event.aggregateVersion > view.lastProcessedVersion → 允許寫入
 *   否則 → 丟棄（過期事件，不覆蓋新狀態）
 *
 *   不變量 #19 泛化：適用全部 Projection，非僅 eligible-view
 *   FUNNEL compose 時統一引用此規則
 *
 * All Projection write paths MUST apply this guard before updating state.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

/**
 * Input to the version guard check. [S2][R7]
 */
export interface VersionGuardInput {
  /** The aggregateVersion carried by the incoming event. */
  readonly eventVersion: number;
  /** The lastProcessedVersion currently stored in the Projection view. */
  readonly viewLastProcessedVersion: number;
}

/**
 * Result of the version guard check. [S2]
 */
export type VersionGuardResult = 'allow' | 'discard';

/**
 * Apply the SK_VERSION_GUARD rule to an incoming event. [S2]
 *
 * Returns 'allow' when the event version is strictly greater than the view's
 * last processed version — preventing stale events from overwriting newer state.
 *
 * Returns 'discard' otherwise (out-of-order or duplicate delivery).
 *
 * Per Invariant #19 (generalized): all Projections, not just eligible-view.
 */
export function applyVersionGuard(input: VersionGuardInput): VersionGuardResult {
  return input.eventVersion > input.viewLastProcessedVersion ? 'allow' : 'discard';
}

/**
 * Type-safe helper: narrow whether version guard allows the write. [S2]
 */
export function versionGuardAllows(input: VersionGuardInput): boolean {
  return applyVersionGuard(input) === 'allow';
}

/**
 * Marker interface — Projection implementations declare conformance. [S2]
 */
export interface ImplementsVersionGuard {
  readonly implementsVersionGuard: true;
}
