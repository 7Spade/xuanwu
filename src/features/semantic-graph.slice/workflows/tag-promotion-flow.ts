/**
 * Module: tag-promotion-flow
 * Purpose: VS8_ROUT workflows ??Tag promotion workflow [T1 D21-5]
 * Responsibilities: Orchestrate the Draft?ctive semantic tag promotion lifecycle,
 *   emitting outbox events and dispatching routing commands via dispatch-bridge
 * Constraints: deterministic logic, ZERO infrastructure imports, no ID hard-coding
 *
 * semantic-graph.slice/centralized-workflows/workflows/tag-promotion-flow [T1 D21-5]
 *
 * Orchestrates the **?倌??瘚?** (tag promotion flow):
 *   Draft tag ??Active promotion ??dispatch policy registration ??routing command.
 *
 * This workflow sits at the VS8_ROUT Reflection Arc [D21-5] and coordinates
 * between the lifecycle workflow (centralized-workflows/tag-lifecycle.workflow.ts)
 * and the routing layer (policy-mapper + dispatch-bridge).
 *
 * Event flow:
 *   1. Caller invokes `promoteTagToActive()` with slug + policy config.
 *   2. Flow calls `activateTag()` from tag-lifecycle.workflow to transition state.
 *   3. Flow registers the tag's dispatch policy via `registerPolicy()`.
 *   4. Flow calls `dispatchForTag()` to produce a routing command.
 *   5. Returns both the outbox event and the dispatch command.
 *
 * [T1] ??Tag lifecycle state machine: Draft ??Active transition.
 * [D21-5] ??VS8_ROUT routing layer ??semantic reflection arc.
 *
 * Dependency rule: imports from tag-lifecycle.workflow, policy-mapper, dispatch-bridge
 * ONLY.  ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '../core/types';
import { dispatchForTag } from '../routing/dispatch-bridge';
import type { DispatchCommand } from '../routing/dispatch-bridge';
import {
  registerPolicy,
  type DispatchPolicy,
  type DispatchActionKind,
} from '../routing/policy-mapper';
import { activateTag } from '../routing/tag-lifecycle.workflow';
import type { OutboxLifecycleEvent } from '../routing/tag-lifecycle.workflow';

// ??? Types ????????????????????????????????????????????????????????????????????

/** Input configuration for the tag promotion flow. */
export interface TagPromotionInput {
  /** The tag slug to promote from Draft to Active. */
  readonly tagSlug: TagSlugRef;
  /** The actor triggering the promotion (for audit). */
  readonly triggeredBy: string;
  /** Next aggregate version (for idempotency). */
  readonly nextVersion: number;
  /** Dispatch policy to register for this tag after promotion. */
  readonly dispatchConfig: {
    readonly actionKind: DispatchActionKind;
    readonly priority: number;
    readonly label: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
  };
}

/** Result of a successful tag promotion flow. */
export interface TagPromotionResult {
  readonly outboxEvent: OutboxLifecycleEvent;
  readonly dispatchCommand: DispatchCommand | null;
  readonly registeredPolicy: DispatchPolicy;
}

// ??? Flow ????????????????????????????????????????????????????????????????????

/**
 * Promote a tag from Draft to Active state, register its dispatch policy,
 * and produce a routing command.
 *
 * [T1] ??Draft ??Active lifecycle transition.
 * [D21-5] ??VS8_ROUT routing arc.
 * [D27-A] ??Dispatch goes through policy-mapper; no ID hard-coding.
 *
 * @throws if the tag is not registered or the Draft ??Active transition is not
 *         allowed by the state machine.
 */
export function promoteTagToActive(input: TagPromotionInput): TagPromotionResult {
  // Step 1: Transition lifecycle state Draft ??Active [T1]
  const outboxEvent = activateTag(input.tagSlug, input.triggeredBy, input.nextVersion);

  // Step 2: Register dispatch policy [D27-A]
  const registeredPolicy: DispatchPolicy = {
    tagSlug: input.tagSlug,
    actionKind: input.dispatchConfig.actionKind,
    priority: input.dispatchConfig.priority,
    label: input.dispatchConfig.label,
    metadata: input.dispatchConfig.metadata,
  };
  registerPolicy(registeredPolicy);

  // Step 3: Dispatch routing command [D21-5]
  const dispatchResult = dispatchForTag(input.tagSlug);
  const dispatchCommand = dispatchResult.success ? dispatchResult.command : null;

  return { outboxEvent, dispatchCommand, registeredPolicy };
}

