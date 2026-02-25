/**
 * shared.kernel.contract-interfaces — Public API
 *
 * [D10] 狀態契約與 Result 接口 (Command/Query)
 *
 * Per tree.md: shared.kernel.contract-interfaces = canonical Result shape for
 *   all Command Handlers and cross-BC Query contracts. [R4]
 *
 * Implementation lives in features/shared-kernel/commands/command-result-contract.ts.
 * This boundary stub re-exports the canonical contract for consumers that
 * import by tree.md slice name.
 */
export type {
  DomainError,
  CommandSuccess,
  CommandFailure,
  CommandResult,
} from '@/features/shared-kernel/commands/command-result-contract';
export {
  commandSuccess,
  commandFailure,
  commandFailureFrom,
} from '@/features/shared-kernel/commands/command-result-contract';
