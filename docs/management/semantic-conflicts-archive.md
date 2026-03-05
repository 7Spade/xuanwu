# Semantic Conflicts — Archive

> Items moved here once their status reaches ✅ Fixed.
> Active/open items live in `docs/management/semantic-conflicts.md`.

---

### SEM-20260304-001 — `tokenRefreshSignals` Collection Path Hardcoded in 4 Feature Slices

**ID**: #SEM-20260304-001
**Rule**: D24 — Feature slices must not hardcode Firestore collection paths; all paths must be centralised in `collection-paths.ts`.
**Severity**: Major
**Fixed**: 2026-03-04 (this PR)

**Problem files** (historical):
- `src/features/identity.slice/_claims-handler.ts` — `` `tokenRefreshSignals/${accountId}` `` literal
- `src/features/identity.slice/_token-refresh-listener.ts` — `doc(db, 'tokenRefreshSignals', accountId)` literal
- `src/features/account.slice/gov.policy/_actions.ts` — `` `tokenRefreshSignals/${accountId}` `` literal
- `src/features/account.slice/gov.role/_actions.ts` — `` `tokenRefreshSignals/${accountId}` `` literal

**Root cause**: The `S6 TOKEN_REFRESH_SIGNAL` collection path `'tokenRefreshSignals'` was duplicated as a bare string literal across all four files. A typo or rename would silently break the entire `[S6]` contract.

**Resolution**:
1. Added `tokenRefreshSignals: 'tokenRefreshSignals'` to `COLLECTIONS` in `src/shared/infra/firestore/collection-paths.ts` with JSDoc linking to `[S6]`.
2. Added `COLLECTIONS` import to all four affected files; replaced every string literal with `COLLECTIONS.tokenRefreshSignals`.

---

### SEM-20260304-002 — `accountRoles` Collection Path Hardcoded in `gov.role/_actions.ts`

**ID**: #SEM-20260304-002
**Rule**: D24 — All Firestore collection paths must be centralised in `collection-paths.ts`.
**Severity**: Minor
**Fixed**: 2026-03-04 (this PR)

**Problem files** (historical):
- `src/features/account.slice/gov.role/_actions.ts` — `` `accountRoles/${orgId}_${accountId}` `` literal (2 occurrences)

**Root cause**: `accountRoles` collection path inlined as bare string, bypassing the centralised constant.

**Resolution**: Added `accountRoles: 'accountRoles'` to `COLLECTIONS`; updated both usages in `gov.role/_actions.ts`.

---

_Archive last updated: 2026-03-04 — 2 entries_
