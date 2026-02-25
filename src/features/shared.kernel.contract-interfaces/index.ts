/**
 * shared.kernel.contract-interfaces — Public API
 *
 * [R4][D10] 狀態契約與 Result 接口 (Command/Query)
 *
 * Per logic-overview_v9.md: shared.kernel.contract-interfaces = canonical Result shape for
 *   all Command Handlers and cross-BC Query contracts. [R4]
 */
export type {
  DomainError,
  CommandSuccess,
  CommandFailure,
  CommandResult,
} from './command-result-contract';
export {
  commandSuccess,
  commandFailure,
  commandFailureFrom,
} from './command-result-contract';
