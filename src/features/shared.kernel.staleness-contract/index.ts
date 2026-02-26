/**
 * shared.kernel.staleness-contract — Public API
 *
 * SK_STALENESS_CONTRACT [S4] — global staleness SLA constants.
 *
 * Per logic-overview.md [S4]:
 *   Single source of truth for all staleness SLA values.
 *   Consumer nodes reference this slice — do NOT hardcode values locally.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

export type {
  StalenessTier,
  ImplementsStalenessContract,
} from './staleness-contract';

export { StalenessMs, getSlaMs, isStale } from './staleness-contract';
