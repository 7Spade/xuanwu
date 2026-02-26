/**
 * shared.kernel.authority-snapshot — Public API
 *
 * [VS0] 權限快照契約 (Authority Snapshot Contract)
 *
 * Per logic-overview.md: shared.kernel.authority-snapshot = cross-BC permission
 *   snapshot contract. Implemented by projection slices that expose authority data.
 *   — projection.workspace-scope-guard (invariant #7, #8)
 *   — projection.account-view (invariant #8)
 */
export type {
  AuthoritySnapshot,
  ImplementsAuthoritySnapshotContract,
} from './authority-snapshot';
