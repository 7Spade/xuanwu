/**
 * Module: dispatch-bridge
 * Purpose: VS8_ROUT ??Scheduling routing & notification dispatch outlet [D21-5 D27-A]
 * Responsibilities: Translate policy-mapper decisions into concrete dispatch commands
 *   for scheduling assignments and notification delivery; never bypass policy-mapper
 * Constraints: deterministic logic, ZERO infrastructure imports, no ID hard-coding
 *
 * semantic-graph.slice/centralized-workflows/dispatch-bridge [D21-5 D27-A]
 *
 * The DispatchBridge is the **dispatch outlet** for the VS8_ROUT Reflection Arc.
 * It receives dispatch commands from policy-mapper resolution results and produces
 * concrete routing outcomes for scheduling and notification consumers.
 *
 * Architectural contract:
 *   - MUST call `resolveDispatchPolicy()` from policy-mapper before any routing.
 *   - NEVER hard-codes business IDs in routing decisions [D27-A].
 *   - Outputs are `DispatchCommand` records that consumers (subscribers, outbox)
 *     materialize into actual effects.
 *
 * Dependency rule: imports from policy-mapper ONLY.
 * ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '../../core/types';
import { resolveDispatchPolicy } from '../policy-mapper';
import type { DispatchPolicy } from '../policy-mapper';

// ??? Types ????????????????????????????????????????????????????????????????????

/** A concrete routing command produced by the dispatch bridge. */
export interface DispatchCommand {
  /** Unique command identifier. */
  readonly commandId: string;
  /** The semantic tag that triggered this dispatch. */
  readonly tagSlug: TagSlugRef;
  /** The resolved policy that produced this command. */
  readonly policy: DispatchPolicy;
  /** ISO-8601 timestamp when the command was created. */
  readonly createdAt: string;
  /** The dispatch lane this command should be sent on. */
  readonly lane: DispatchLane;
}

/** Dispatch lane determines urgency and delivery guarantees. */
export type DispatchLane =
  | 'IMMEDIATE'    // Must be processed before the current operation returns
  | 'FOREGROUND'   // Process as soon as UI is free
  | 'BACKGROUND';  // Process in background queue

/** Result of a dispatch attempt. */
export type DispatchResult =
  | { readonly success: true; readonly command: DispatchCommand }
  | { readonly success: false; readonly reason: string };

// ??? Internal helpers ?????????????????????????????????????????????????????????

let _commandCounter = 0;

function _generateCommandId(tagSlug: TagSlugRef): string {
  _commandCounter += 1;
  return `dispatch:${tagSlug as string}:${_commandCounter}`;
}

function _determineLane(priority: number): DispatchLane {
  if (priority >= 80) return 'IMMEDIATE';
  if (priority >= 40) return 'FOREGROUND';
  return 'BACKGROUND';
}

// ??? Public API ???????????????????????????????????????????????????????????????

/**
 * Attempt to dispatch a routing command for the given semantic tag slug.
 *
 * 1. Calls `resolveDispatchPolicy()` from policy-mapper.
 * 2. If a policy is found, creates a `DispatchCommand`.
 * 3. Returns `{ success: true, command }` or `{ success: false, reason }`.
 *
 * [D27-A] ??all dispatch goes through policy-mapper; no ID hard-coding.
 * [D21-5] ??VS8_ROUT Reflection Arc dispatch outlet.
 */
export function dispatchForTag(tagSlug: TagSlugRef): DispatchResult {
  const resolution = resolveDispatchPolicy(tagSlug);

  if (!resolution.found) {
    return { success: false, reason: resolution.reason };
  }

  const command: DispatchCommand = {
    commandId: _generateCommandId(tagSlug),
    tagSlug,
    policy: resolution.policy,
    createdAt: new Date().toISOString(),
    lane: _determineLane(resolution.policy.priority),
  };

  return { success: true, command };
}

/**
 * Batch-dispatch routing commands for multiple tag slugs.
 * Returns only the successful commands; failures are silently discarded unless
 * `strict` is `true`, in which case any failure throws.
 */
export function dispatchForTags(
  tagSlugs: readonly TagSlugRef[],
  strict = false
): readonly DispatchCommand[] {
  const commands: DispatchCommand[] = [];

  for (const slug of tagSlugs) {
    const result = dispatchForTag(slug);
    if (result.success) {
      commands.push(result.command);
    } else if (strict) {
      throw new Error(`[dispatch-bridge] ${result.reason}`);
    }
  }

  return commands;
}

/** Reset command counter (used in tests). */
export function _resetCommandCounterForTest(): void {
  _commandCounter = 0;
}

