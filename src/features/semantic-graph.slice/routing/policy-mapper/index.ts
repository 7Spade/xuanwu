/**
 * Module: policy-mapper
 * Purpose: VS8_ROUT semantic tag -> dispatch strategy mapping [D27-A].
 * Responsibilities: Translate semantic tag slugs into dispatch strategies so
 *   that routing logic never uses hard-coded business IDs
 * Constraints: deterministic logic, ZERO infrastructure imports, no ID hard-coding
 *
 * semantic-graph.slice/centralized-workflows/policy-mapper [D27-A]
 *
 * The PolicyMapper is the authoritative translator between **semantic tag slugs**
 * and **dispatch strategies** (routing instructions).  All dispatch logic in the
 * system MUST call `resolveDispatchPolicy()` instead of hard-coding business IDs
 * directly into routing rules.
 *
 * Rule [D27-A] Semantic-Aware Routing:
 *   Notification and scheduling dispatch are forbidden from hard-coding business IDs;
 *   all routing must go through the semantic policy mapper.
 *   (Notification/scheduling dispatch is forbidden from hard-coding business IDs;
 *    all routing must go through the semantic policy mapper.)
 *
 * The policy registry maps semantic tag slugs to DispatchPolicy records.
 * External slices register their domain policies at startup via
 * `registerPolicy()`, and the dispatch-bridge calls `resolveDispatchPolicy()`
 * to retrieve the strategy for a given tag.
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '../../core/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The kind of dispatch action to perform. */
export type DispatchActionKind =
  | 'NOTIFY_RESPONSIBLE_PARTY'
  | 'ASSIGN_TO_WORKER'
  | 'ESCALATE'
  | 'ARCHIVE'
  | 'PROMOTE_TAG'
  | 'ALERT_ROUTING';

/** A single routing instruction resolved from a semantic tag. */
export interface DispatchPolicy {
  /** The semantic tag slug this policy applies to. */
  readonly tagSlug: TagSlugRef;
  /** What action the dispatcher should perform. */
  readonly actionKind: DispatchActionKind;
  /** Optional priority level (higher = more urgent). */
  readonly priority: number;
  /** Human-readable label for logging/debugging. */
  readonly label: string;
  /** Additional domain-specific metadata (opaque to the policy-mapper). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Result of resolving a dispatch policy. */
export type PolicyResolutionResult =
  | { readonly found: true; readonly policy: DispatchPolicy }
  | { readonly found: false; readonly reason: string };

// ---------------------------------------------------------------------------
// Internal registry
// ---------------------------------------------------------------------------

const _policyRegistry = new Map<string, DispatchPolicy>();

// ---------------------------------------------------------------------------
// Mutation API
// ---------------------------------------------------------------------------

/**
 * Register a dispatch policy for a semantic tag slug.
 * Overwrites any previously registered policy for the same slug.
 *
 * Called at domain slice startup, NOT in hot paths.
 * [D27-A] All dispatch strategies must be registered here.
 */
export function registerPolicy(policy: DispatchPolicy): void {
  _policyRegistry.set(policy.tagSlug as string, policy);
}

/**
 * Remove a dispatch policy (e.g., when a tag is deprecated).
 */
export function unregisterPolicy(tagSlug: TagSlugRef): boolean {
  return _policyRegistry.delete(tagSlug as string);
}

// ---------------------------------------------------------------------------
// Query API
// ---------------------------------------------------------------------------

/**
 * Resolve the dispatch policy for the given semantic tag slug.
 *
 * Returns `{ found: true, policy }` when a policy is registered.
 * Returns `{ found: false, reason }` when no policy is found.
 *
 * The dispatch-bridge calls this function BEFORE executing any routing
 * decision so that business ID hard-coding is prevented [D27-A].
 */
export function resolveDispatchPolicy(tagSlug: TagSlugRef): PolicyResolutionResult {
  const slug = tagSlug as string;
  const policy = _policyRegistry.get(slug);

  if (policy !== undefined) {
    return { found: true, policy };
  }

  // Attempt prefix-based fallback (ws:<id>: ??strip workspace prefix)
  const globalSlug = slug.replace(/^ws:[^:]+:/, '');
  const fallback = globalSlug !== slug ? _policyRegistry.get(globalSlug) : undefined;

  if (fallback !== undefined) {
    return { found: true, policy: { ...fallback, tagSlug } };
  }

  return {
    found: false,
    reason: `No dispatch policy registered for tag "${slug}".`,
  };
}

/**
 * Return all registered policies (read-only snapshot).
 * Useful for debugging and test assertions.
 */
export function getAllPolicies(): readonly DispatchPolicy[] {
  return Array.from(_policyRegistry.values());
}

/** Clear all registered policies (used in tests). */
export function _clearPoliciesForTest(): void {
  _policyRegistry.clear();
}

