/**
 * infra.gateway-command — Public API
 *
 * [GW] 指令閘道器 (驗權、RateLimit、Entry)
 *
 * Per tree.md: infra.gateway-command = Command Gateway
 *   — Authentication / authorization guard before dispatching commands.
 *   — Rate limiting per account/org.
 *   — Single entry point for all write operations.
 *   — Wires to workspace-application CommandHandler.
 *
 * TODO: Implement command gateway with auth guard and rate limiter.
 *
 * Consumers:
 *   - src/app API route handlers (Server Actions dispatch through here)
 *   - workspace-application command coordinator
 */

// Placeholder — implementation pending.
// Once implemented, export: dispatchCommand, type CommandGatewayConfig
export {};
