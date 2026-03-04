# Technical Debt — Archive

> Items moved here once their status reaches ✅ Fixed.
> Active/open items live in `docs/management/technical-debt.md`.

---

### TDBT-20260304-002 — `createParsingImport` Was Non-Atomic (TOCTOU Race)

**ID**: #TDBT-20260304-002
**Rule**: D14 — Idempotent writes must be atomic; a non-atomic read-then-write is a TOCTOU race.
**Severity**: Critical (at time of detection)
**Fixed**: 2026-03-04 (previous PR)

**Problem file** (historical):
- `src/shared/infra/firestore/repositories/workspace-business.parsing-imports.repository.ts`

**Root cause**: `createParsingImport` used `addDocument` (random Firestore ID) combined with a separate `getByIdempotencyKey` query. Under concurrent parallel imports, both callers could pass the query check before either write committed, resulting in duplicate `parsingImport` records and downstream task doubling.

**Resolution**:
1. Changed document ID strategy from random to **deterministic** — `docId = idempotencyKey`.
2. Wrapped write in `runTransaction` for atomic "create-if-not-exists" — the transaction loser silently no-ops.
3. `getParsingImportByIdempotencyKey` is now an O(1) `getDoc(docRef)` rather than an O(n) `where` query.

The synchronous in-memory `inProgressImports` ref in `use-workspace-event-handler.tsx` serves as the first-line TOCTOU guard at the React layer; the Firestore transaction is the second-line defence for cross-session duplicates.

---

_Archive last updated: 2026-03-04 — 1 entry_

---

### TDBT-20260304-001 — `startOutboxRelay` No-Reconnect Workaround Removed

**ID**: #TDBT-20260304-001
**Rule**: D11 — Side-effect workers must be resilient against transient failures.
**Severity**: Major
**Fixed**: 2026-03-04 (this PR)

**Problem file** (historical):
- `src/features/infra.outbox-relay/_relay.ts`

**Root cause**: `startOutboxRelay` had a code comment explicitly acknowledging it "will NOT auto-reconnect after an error." The `onError` callback only called `console.error` and left the listener permanently dead.

**Resolution**: Refactored `startOutboxRelay` to use an inner `install()` function that re-subscribes with exponential backoff (`Math.min(1000 * 2^retryCount, 30_000)`) on every `onError` event. The returned stop function cancels any pending reconnect timer. Full details in `performance-bottlenecks-archive.md` #PERF-20260304-001.

---

_Archive last updated: 2026-03-04 — 2 entries_
