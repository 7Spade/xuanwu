# Performance Bottlenecks — Archive

> Items moved here once their status reaches ✅ Fixed.
> Active/open items live in `docs/management/performance-bottlenecks.md`.

---

### PERF-20260304-001 — Outbox-Relay `onSnapshot` Did Not Auto-Reconnect After Error

**ID**: #PERF-20260304-001
**Rule**: D11 — Side-effect workers must be resilient against transient failures.
**Severity**: Major
**Fixed**: 2026-03-04 (this PR)

**Problem file** (historical):
- `src/features/infra.outbox-relay/_relay.ts`

**Root cause**:
`startOutboxRelay` installed a Firestore `onSnapshot` CDC listener with an `onError` callback that only logged the error. On any transient network or auth failure, the listener permanently died — no reconnect, no alert. Pending outbox entries would stall until the next browser restart. This was documented in the code itself as "will NOT auto-reconnect after an error; the caller should restart the relay worker on app restart."

**Resolution**:
Refactored `startOutboxRelay` to extract an inner `install()` function. The `onError` callback now:
1. Calls `logDomainError(...)` using the structured observability API (replacing bare `console.error`).
2. Schedules a self-reinstall via `setTimeout` with exponential backoff: 1 s → 2 s → 4 s … capped at 30 s.
3. Resets the `retryCount` counter to 0 on the first successful snapshot after recovery.

The returned `Unsubscribe` function now also cancels any pending `setTimeout` (via `retryTimeoutId`) to prevent ghost reconnects after the relay has been explicitly stopped.

**Key change summary**:
```diff
- const unsubscribe = onSnapshot(q, onNext, (err) => {
-   console.error(`[outbox-relay] CDC listener error ...`, err);
- });
- return unsubscribe;
+ function install(): void {
+   currentUnsubscribe = onSnapshot(q,
+     (snap) => { retryCount = 0; /* ... */ },
+     (err) => {
+       logDomainError({ ... });
+       const backoffMs = Math.min(1_000 * 2 ** retryCount, 30_000);
+       retryCount += 1;
+       retryTimeoutId = setTimeout(() => install(), backoffMs);
+     }
+   );
+ }
+ install();
+ return () => { stopped = true; clearTimeout(retryTimeoutId); currentUnsubscribe?.(); };
```

---

_Archive last updated: 2026-03-04 — 1 entry_
