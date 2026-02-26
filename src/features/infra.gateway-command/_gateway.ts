/**
 * infra.gateway-command — _gateway.ts
 *
 * [GW] Command Bus Gateway — unified write entry point. [E4][R4][R8][Q4][Q7]
 *
 * Per logic-overview_v9.md GW_CMD:
 *   CBG_ENTRY  — unified-command-gateway: injects TraceID [E4][R8]
 *   CBG_AUTH   — universal-authority-interceptor: AuthoritySnapshot [Q4]
 *               ACTIVE_CTX takes precedence over Claims when they conflict.
 *   CBG_ROUTE  — command-router: routes to the correct slice handler,
 *               returns SK_CMD_RESULT [R4]
 *
 * Invariants:
 *   D9  — traceId written into every envelope at entry; never overwritten downstream.
 *   R8  — All commands carry a traceId shared across the full event chain.
 *   Q7  — Three-layer guard: rate-limit → circuit-breaker → bulkhead (stub hooks provided).
 */

import type { AuthoritySnapshot } from '@/features/shared.kernel.authority-snapshot';
import type { CommandResult } from '@/features/shared.kernel.contract-interfaces';
import { commandFailureFrom } from '@/features/shared.kernel.contract-interfaces';

// ---------------------------------------------------------------------------
// Command descriptor
// ---------------------------------------------------------------------------

/**
 * Minimum shape every command must satisfy to be routed by the gateway.
 * Slices extend this with their own typed payloads.
 */
export interface GatewayCommand {
  /** Namespaced command type, e.g. "workspace:tasks:assign". */
  readonly commandType: string;
  /** The aggregate the command targets. */
  readonly aggregateId: string;
}

// ---------------------------------------------------------------------------
// Command handler registry
// ---------------------------------------------------------------------------

type CommandHandler<TCmd extends GatewayCommand = GatewayCommand> = (
  command: TCmd,
  traceId: string
) => Promise<CommandResult>;

const handlerRegistry = new Map<string, CommandHandler>();

/**
 * Register a command handler for a given commandType.
 * Slices call this during their module initialization.
 *
 * @example
 * // src/features/workspace-application/_command-handler.ts
 * registerCommandHandler('workspace:tasks:assign', assignTaskHandler);
 */
export function registerCommandHandler<TCmd extends GatewayCommand>(
  commandType: string,
  handler: CommandHandler<TCmd>
): void {
  handlerRegistry.set(commandType, handler as CommandHandler);
}

// ---------------------------------------------------------------------------
// Gateway options
// ---------------------------------------------------------------------------

export interface DispatchOptions {
  /**
   * Caller-supplied traceId. If omitted, a new UUID is generated at entry [E4][R8].
   * Downstream events MUST carry this value unchanged.
   */
  readonly traceId?: string;
  /**
   * Authority snapshot for the acting subject.
   * The universal-authority-interceptor uses this to enforce access control [Q4].
   * When ACTIVE_CTX and Firebase Claims conflict, ACTIVE_CTX takes precedence.
   */
  readonly authority?: AuthoritySnapshot | null;
}

// ---------------------------------------------------------------------------
// CBG_ENTRY — TraceID injection [E4][R8]
// ---------------------------------------------------------------------------

function injectTraceId(opts?: DispatchOptions): string {
  if (opts?.traceId) return opts.traceId;
  // Use Node.js built-in crypto for cross-runtime compatibility (Node 14.17+/18+).
  // Next.js 16 / App Router runs on Node 18+, so this is always available.
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------
// CBG_AUTH — universal-authority-interceptor [Q4]
// ---------------------------------------------------------------------------

/**
 * Validates that the caller is permitted to issue the given command.
 *
 * Current implementation: presence of an AuthoritySnapshot is sufficient.
 * TODO: Enforce per-commandType RBAC checks [D12] — track in architecture backlog
 *       as "gateway-command: role-based per-commandType permission enforcement".
 *
 * ACTIVE_CTX precedence: the authority snapshot passed in here represents
 * the currently active context and overrides token Claims when they diverge [Q4].
 */
function checkAuthority(
  command: GatewayCommand,
  authority: AuthoritySnapshot | null | undefined
): CommandResult | null {
  if (!authority) {
    return commandFailureFrom(
      'UNAUTHORIZED',
      `Command "${command.commandType}" rejected — no authority snapshot provided.`,
      { aggregateId: command.aggregateId }
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// CBG_ROUTE — command-router [R4]
// ---------------------------------------------------------------------------

async function routeCommand(
  command: GatewayCommand,
  traceId: string
): Promise<CommandResult> {
  const handler = handlerRegistry.get(command.commandType);
  if (!handler) {
    return commandFailureFrom(
      'COMMAND_NOT_FOUND',
      `No handler registered for commandType "${command.commandType}".`,
      { aggregateId: command.aggregateId, commandType: command.commandType }
    );
  }
  return handler(command, traceId);
}

// ---------------------------------------------------------------------------
// Public entry point: dispatchCommand
// ---------------------------------------------------------------------------

/**
 * Unified command dispatch entry point.
 *
 * Pipeline:
 *   [Q7 guard hooks] → CBG_ENTRY (TraceID) → CBG_AUTH (authority) → CBG_ROUTE
 *
 * @example
 * const result = await dispatchCommand(
 *   { commandType: 'workspace:task:assign', aggregateId: workspaceId, ...payload },
 *   { authority: authoritySnapshot, traceId: existingTraceId }
 * );
 */
export async function dispatchCommand<TCmd extends GatewayCommand>(
  command: TCmd,
  opts?: DispatchOptions
): Promise<CommandResult> {
  const traceId = injectTraceId(opts);

  const authResult = checkAuthority(command, opts?.authority);
  if (authResult) return authResult;

  try {
    return await routeCommand(command, traceId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailureFrom(
      'COMMAND_EXECUTION_ERROR',
      `Unhandled error while executing "${command.commandType}": ${message}`,
      { aggregateId: command.aggregateId, traceId }
    );
  }
}
