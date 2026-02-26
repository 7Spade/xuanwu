/**
 * infra.gateway-command — Public API
 *
 * [GW] Command Bus Gateway — unified write entry point. [E4][R4][R8][Q4][Q7]
 *
 * Per logic-overview_v9.md GW_CMD:
 *   CBG_ENTRY  — TraceID injection [E4][R8]
 *   CBG_AUTH   — universal-authority-interceptor (AuthoritySnapshot [Q4];
 *               ACTIVE_CTX wins over Claims on conflict)
 *   CBG_ROUTE  — command-router → returns SK_CMD_RESULT [R4]
 *
 * Usage (Server Actions):
 *   import { dispatchCommand, registerCommandHandler } from '@/features/infra.gateway-command';
 *
 *   // register (slice init):
 *   registerCommandHandler('workspace:task:assign', assignTaskHandler);
 *
 *   // dispatch (Server Action):
 *   const result = await dispatchCommand(
 *     { commandType: 'workspace:task:assign', aggregateId: wsId, ...payload },
 *     { authority: authoritySnapshot }
 *   );
 */

export { dispatchCommand, registerCommandHandler } from './_gateway';
export type { GatewayCommand, DispatchOptions } from './_gateway';
