# Architecture Audit — Open / In-Progress Issues

> **Source of truth**: `docs/logic-overview.md`  
> **Auditor**: 架構合規審計官 (Architectural Compliance Auditor)  
> **Audit date**: 2026-03-04  
> **Note**: Resolved items are migrated to `docs/management/issues-archive.md`.

---

## DOC-PARSER-D14-001 — Write Idempotency Failure in `saveParsingIntent` [D14/D15]

**ID**: #ISSUE-20260304-008  
**Rule**: D14 — Version-protected writes must be idempotent; D15 — Write consistency (no duplicate document creation)  
**Severity**: Critical  
**Status**: ✅ Fixed (this PR — commit `fix(D14/D15): add sourceFileId idempotency guard to saveParsingIntent`)

**Problem file**:
- `src/features/workspace.slice/business.document-parser/_intent-actions.ts`

**Root cause**:  
`saveParsingIntent` called `createParsingIntentFacade` (backed by `addDocument`) unconditionally on every invocation. When a user re-uploaded the same document — or when a network retry caused the caller to fire twice — a second distinct `ParsingIntent` document was created in Firestore for the same source file. Each redundant intent could trigger independent task-materialization import runs, causing **task duplication** in the workspace.

The `startParsingImport` ledger already had its own idempotency key guard, but upstream `saveParsingIntent` was the earlier entry point where duplication occurred.

**Fix applied**:  
1. Added `getParsingIntentBySourceFileId` to `workspace-business.document-parser.repository.ts` — queries `parsingIntents` subcollection filtered by `sourceFileId` and `status != 'superseded'`, ordered by `createdAt desc`, limit 1.  
2. Exported the new function through the `firestore.facade.ts` and the repositories `index.ts`.  
3. In `saveParsingIntent`, when `options.sourceFileId` is provided:
   - Query for an existing non-superseded intent.
   - **Same `semanticHash`**: return the existing intent immediately — no Firestore write (true idempotency).
   - **Different `semanticHash`**: the file was re-parsed; automatically set `previousIntentId` to supersede the old intent before creating the new one.
   - **No existing intent**: proceed with `createParsingIntentFacade` as before.

```ts
// ✅ D14/D15 compliant — idempotency guard added
if (options?.sourceFileId) {
  const existing = await getParsingIntentBySourceFileIdFacade(workspaceId, options.sourceFileId)
  if (existing) {
    if (existing.semanticHash === semanticHash) {
      return { intentId: existing.id as IntentID }          // no-op, same content
    }
    options = { ...options, previousIntentId: existing.id as IntentID }  // auto-supersede
  }
}
```

---

## Audit Summary — 2026-03-04 (Updated)

| Issue ID | File(s) | Rule | Severity | Status |
|---|---|---|---|---|
| #ISSUE-20260304-008 | `workspace.slice/business.document-parser/_intent-actions.ts` | D14/D15 | Critical | ✅ Fixed |

**Resolved items** (#ISSUE-20260304-001 through #ISSUE-20260304-007) have been migrated to `docs/management/issues-archive.md`.
