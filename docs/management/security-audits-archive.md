# Security Audits — Archive

> Items moved here once their status reaches ✅ Fixed.
> Active/open items live in `docs/management/security-audits.md`.

---

### SEC-20260304-001 — Internal Aggregate ID Leaked in `console.warn` in Production Bundle

**ID**: #SEC-20260304-001
**Rule**: D22 — No internal identifiers (Firestore document IDs, aggregate IDs) must be written to the browser console in production builds.
**Severity**: Low
**Fixed**: 2026-03-04 (this PR)

**Problem file** (historical):
- `src/features/workspace.slice/core/_components/workspace-provider.tsx` (line ~288)

**Root cause**:
When a scheduled workspace item cannot publish a `workspace:schedule:proposed` event (because `workspace.dimensionId` is absent), the component emitted:

```ts
console.warn(
  `[W_B_SCHEDULE] workspace:schedule:proposed not published for item "${result.aggregateId}" — workspace.dimensionId is missing.`
);
```

`result.aggregateId` is a raw Firestore document ID. While not a cryptographic secret, exposing internal storage identifiers:
1. Aids adversarial enumeration of document IDs.
2. Leaks internal domain terminology (`aggregateId`, `dimensionId`) to end users with DevTools open.
3. Violates the D22 principle of keeping infra topology opaque at the presentation layer.

**Resolution**:
Wrapped the `console.warn` in a `process.env.NODE_ENV !== 'production'` guard. The warning is retained for local development and CI but is dead-code-eliminated from the production bundle by Next.js's build-time constant folding.

```diff
- console.warn(
-   `[W_B_SCHEDULE] workspace:schedule:proposed not published for item "${result.aggregateId}" — workspace.dimensionId is missing. Org-level scheduling will not be triggered.`
- );
+ // [D22] Do not expose internal aggregate IDs in the production console.
+ if (process.env.NODE_ENV !== 'production') {
+   console.warn(
+     `[W_B_SCHEDULE] workspace:schedule:proposed not published for item "${result.aggregateId}" — workspace.dimensionId is missing. Org-level scheduling will not be triggered.`
+   );
+ }
```

---

_Archive last updated: 2026-03-04 — 1 entry_
