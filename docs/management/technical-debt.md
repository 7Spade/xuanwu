# Technical Debt — Open / In-Progress Items

> **Source of truth**: `docs/logic-overview.md`
> **Category**: Technical Debt — Legacy code awaiting refactor, untested slices, temporary workarounds, known concurrency limitations.
> **Audit date**: 2026-03-04
> **Note**: Resolved items are migrated to `docs/management/technical-debt-archive.md`.

---

_No open technical debt items at this time._

Both items detected during the 2026-03-04 audit have been resolved and archived:
- #TDBT-20260304-001 (`startOutboxRelay` no-reconnect workaround) — fixed this PR.
- #TDBT-20260304-002 (`createParsingImport` non-atomic race) — fixed in previous PR.

---

## Audit Summary — 2026-03-04

| Issue ID | File(s) | Rule | Severity | Status |
|---|---|---|---|---|
| #TDBT-20260304-001 | `infra.outbox-relay/_relay.ts` | D11 | Major | ✅ Archived |
| #TDBT-20260304-002 | `workspace-business.parsing-imports.repository.ts` | D14 | Critical | ✅ Archived |
