/**
 * notification-hub.slice — _actions.ts
 *
 * Cross-cutting Authority — Server actions for the sole side-effect outlet. [D3]
 *
 * Per logic-overview.md [D26]:
 *   notification-hub = sole side-effect outlet.
 *   All notification dispatch MUST route through these actions.
 *
 * Architecture:
 *   [D3]   All notification side-effects go through _actions.ts.
 *   [#A10] Notification routing is stateless.
 *   [D26]  Owns _actions.ts / _services.ts; does not parasitize shared-kernel.
 */

import type { CommandResult } from '@/features/shared-kernel';
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';

import {
  processNotificationEvent,
  registerRoutingRule as registerRoutingRuleService,
  unregisterRoutingRule as unregisterRoutingRuleService,
} from './_services';
import type {
  NotificationSourceEvent,
  TagRoutingRule,
  NotificationDispatchResult,
} from './_types';

// =================================================================
// Notification Dispatch Action
// =================================================================

/**
 * Result wrapper for notification dispatch — carries both CommandResult
 * and the full dispatch result for status tracking.
 */
export interface DispatchNotificationResult {
  readonly commandResult: CommandResult;
  readonly dispatch: NotificationDispatchResult | null;
}

/**
 * Process a source event through the notification hub's tag-aware routing
 * pipeline and dispatch to the appropriate channels.
 *
 * This is the SOLE entry point for triggering notifications in the system.
 * Returns both CommandResult per [R4] and the dispatch result for status tracking.
 */
export async function dispatchNotification(
  event: NotificationSourceEvent
): Promise<DispatchNotificationResult> {
  try {
    const result = await processNotificationEvent(event);
    return {
      commandResult: commandSuccess(result.dispatchId, 0),
      dispatch: result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      commandResult: commandFailureFrom('NOTIFICATION_DISPATCH_FAILED', message),
      dispatch: null,
    };
  }
}

// =================================================================
// Routing Rule Management Actions
// =================================================================

/**
 * Register a new tag-aware routing rule.
 * Rules determine which channels fire based on event tags.
 */
export async function registerRoutingRule(
  rule: TagRoutingRule
): Promise<CommandResult> {
  try {
    registerRoutingRuleService(rule);
    return commandSuccess(rule.ruleId, 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ROUTING_RULE_REGISTRATION_FAILED', message);
  }
}

/**
 * Unregister an existing routing rule by ID.
 */
export async function unregisterRoutingRule(
  ruleId: string
): Promise<CommandResult> {
  try {
    unregisterRoutingRuleService(ruleId);
    return commandSuccess(ruleId, 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom('ROUTING_RULE_UNREGISTRATION_FAILED', message);
  }
}

// =================================================================
// Final Dispatch Action (D3)
// =================================================================

/**
 * Trigger the final notification dispatch — executes transmission
 * and records the dispatch status.
 *
 * This is an alias for dispatchNotification that emphasises the
 * "trigger → delivery" semantics requested by the event routing
 * architecture (VS7 · TagEventRouter pipeline).
 */
export async function triggerDispatch(
  event: NotificationSourceEvent
): Promise<DispatchNotificationResult> {
  return dispatchNotification(event);
}
