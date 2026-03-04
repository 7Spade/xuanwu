# Architecture Audit — Open / In-Progress Issues

> **Source of truth**: `docs/logic-overview.md`
> **Auditor**: 全鏈路架構治理官 (End-to-End Architectural Governance Officer)
> **Audit date**: 2026-03-04
> **Note**: Resolved items are migrated to `docs/management/issues-archive.md`.

---

_No open issues at this time._

All previously logged critical issues (#ISSUE-20260304-008, #BUG-20260304-001) have been fixed and migrated to `docs/management/issues-archive.md`.

New cross-category findings from the 2026-03-04 governance audit are tracked in the appropriate specialist files:

| Category | File | Open Items |
|---|---|---|
| Semantic conflicts | `semantic-conflicts.md` | 0 (both SEM-001, SEM-002 fixed this PR) |
| Performance bottlenecks | `performance-bottlenecks.md` | 1 (PERF-001 — outbox relay no-reconnect) |
| Security audits | `security-audits.md` | 1 (SEC-001 — console.warn ID disclosure, Low) |
| Technical debt | `technical-debt.md` | 1 (TDBT-001 — relay no-reconnect workaround) |

---

## Audit Summary — 2026-03-04

| Issue ID | File(s) | Rule | Severity | Status |
|---|---|---|---|---|
| #ISSUE-20260304-008 | `workspace.slice/business.document-parser/_intent-actions.ts` | D14/D15 | Critical | ✅ Archived |
| #BUG-20260304-001 | `workspace.slice/core/_hooks/use-workspace-event-handler.tsx` | D14/D15 | Critical | ✅ Archived |
