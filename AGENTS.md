# Agent Setup Instructions

This file is read by AI coding agents (GitHub Copilot Coding Agent, Codex, etc.) at the
start of every session. Follow these steps **before** running any validation commands.

## Environment Bootstrap (MANDATORY — run once per session)

```bash
npm install
```

> **Why this is required**: The sandbox starts without `node_modules`. Running
> `npm run lint` or `npm run typecheck` without installing dependencies produces
> thousands of false-positive "Cannot find module" errors that make quality reports
> completely untrustworthy. Always install first.

## Validation Commands

Run these **only after** `npm install` has completed successfully:

| Command | What it checks | Trustworthy only if |
|---------|---------------|---------------------|
| `npm run lint` | ESLint architecture rules (D1–D25) | `node_modules/.bin/eslint` exists |
| `npm run typecheck` | TypeScript types | `node_modules/.bin/tsc` exists |
| `npm run check` | Both in one pass | `node_modules` installed |

## Interpreting Results

- **`npm run lint`** — zero errors (warnings about existing D24 SDK calls are expected and tracked — see below)
- **`npm run typecheck`** — zero errors
- If you see `Cannot find module 'react'` or similar: **deps are not installed**, output is noise, do not report these as code errors

## Dev Server

```bash
npm run dev   # starts on http://localhost:9002
```

## Known Baseline (after `npm install`)

| Check | Expected result |
|-------|----------------|
| `npm run lint` | 0 errors, ~1390 warnings |
| `npm run typecheck` | 67 errors — ALL in `firebase/functions/` (separate sub-package, not the Next.js app) |

> `firebase/functions/` has its own `package.json`. Its 67 TypeScript errors require
> `npm install --prefix firebase/functions` and are unrelated to the Next.js application.
> Do NOT report them as app errors.

## Known D24 Architectural Debt (Tracked Warnings)

The `~1390 lint warnings` include **45 D24 warnings** — direct `firebase/firestore` imports in feature slices.
These are **tracked migration targets**, not regressions. Per `docs/logic-overview.md` [D24]:

> Feature slices must not import `firebase/*` directly. All SDK calls must go through `FIREBASE_ACL`
> adapters at `src/shared/infra/{auth,firestore,messaging,storage}/`, accessed via `SK_PORTS` interfaces.

Current D24 violation files (45 total):
- `src/features/account.slice/` — gov.policy, gov.role, user.profile, user.wallet (4 files)
- `src/features/identity.slice/` — `_token-refresh-listener.ts` (1 file)
- `src/features/notification.slice/` — user.notification delivery + queries (2 files)
- `src/features/organization.slice/` — core, gov.members, gov.partners, gov.policy, gov.teams (5 files)
- `src/features/projection.bus/` — account-audit, account-view, global-audit-view, org-eligible-member-view, organization-view, tag-snapshot, workspace-scope-guard, workspace-view (11 files: _projector and/or _queries per sub-projection)
- `src/features/scheduling.slice/` — aggregate, components, hooks, projectors, queries (9 files)
- `src/features/skill-xp.slice/` — projector, queries, tag-lifecycle (3 files)
- `src/features/workspace.slice/` — business.daily, business.document-parser, business.files, business.workflow, core, gov.audit (10 files)

**Any new code must NOT add to this list.** D24 migration requires a dedicated PR.

## Workflow for Architecture Alignment

Before making changes, always follow the GEMINI.md workflow:

1. **`.github/prompts/GEMINI.md`** — master agent orchestration index
2. **`compliance-audit.prompt.md`** — run before PR to verify docs alignment
3. **`iterative-alignment-refactor.prompt.md`** — for fixing D-rule violations

## Key Files

- `docs/logic-overview.md` — **SSOT** architecture rules (D1–D25, invariants #1–#19)
- `eslint.config.mts` — enforces D1–D25 as ESLint rules
- `.github/copilot-instructions.md` — agent workflow instructions
- `.github/prompts/GEMINI.md` — AI prompt orchestration index
