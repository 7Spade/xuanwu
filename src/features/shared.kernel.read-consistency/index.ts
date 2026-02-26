/**
 * shared.kernel.read-consistency — Public API
 *
 * SK_READ_CONSISTENCY [S3] — read consistency routing contract.
 *
 * Per logic-overview_v10.md [S3]:
 *   Unified read-pattern decision standard for all slices.
 *   STRONG_READ → Domain Aggregate; EVENTUAL_READ → Projection.
 *
 * Invariant: Zero infrastructure dependencies (no Firebase, no React, no I/O).
 */

export type {
  ReadConsistencyMode,
  ReadConsistencyContext,
  ImplementsReadConsistency,
} from './read-consistency';

export { resolveReadConsistency } from './read-consistency';
