/**
 * version-guard.middleware.ts — Firestore Write Version Guard
 *
 * [S2] applyVersionGuard() must be called before EVERY Projection write.
 *      Wraps version-guard logic with Firestore-specific helpers.
 *
 * Usage in Projection write paths:
 *   const existing = await firestoreAdapter.getDoc(path, id);
 *   const lastVersion = (existing?.data as { lastProcessedVersion?: number })?.lastProcessedVersion ?? -1;
 *   if (!allowFirestoreWrite(envelope.aggregateVersion, lastVersion)) return; // stale event [S2]
 *
 * Note: Version guard logic is inlined here to avoid importing from features/ [D5].
 *       The canonical contract definition lives in features/shared-kernel/version-guard.
 *       If the monotonic-version rule changes, update BOTH locations in sync.
 */

/** Result of the version guard decision [S2]. */
export type VersionGuardResult = 'allow' | 'discard';

/**
 * Check whether an incoming event's version is newer than the currently stored version.
 *
 * [S2] Returns 'allow' if the Projection write should proceed.
 *      Returns 'discard' if the event is stale and must be silently dropped.
 *
 * @param eventVersion            aggregateVersion from the EventEnvelope
 * @param viewLastProcessedVersion lastProcessedVersion from the Firestore view document (-1 if not yet written)
 */
export function applyFirestoreVersionGuard(
  eventVersion: number,
  viewLastProcessedVersion: number
): VersionGuardResult {
  return eventVersion > viewLastProcessedVersion ? 'allow' : 'discard';
}

/**
 * Boolean shorthand for applyFirestoreVersionGuard.
 * Returns true when the write is permitted.
 */
export function allowFirestoreWrite(
  eventVersion: number,
  viewLastProcessedVersion: number
): boolean {
  return applyFirestoreVersionGuard(eventVersion, viewLastProcessedVersion) === 'allow';
}
