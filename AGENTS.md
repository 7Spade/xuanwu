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

The `~1390 lint warnings` include **43 D24 warnings** — direct `firebase/firestore` imports in feature slices.
These are **tracked migration targets**, not regressions. Per `docs\architecture\00-LogicOverview.md` [D24]:

> Feature slices must not import `firebase/*` directly. All SDK calls must go through `FIREBASE_ACL`
> adapters at `src/shared-infra/frontend-firebase/{auth,firestore,messaging,storage}/`, accessed via `SK_PORTS` interfaces.

Current D24 violation files (43 total):
- `src/features/account.slice/` — gov.policy, gov.role, user.profile, user.wallet (4 files)
- `src/features/identity.slice/` — `_token-refresh-listener.ts` (1 file)
- `src/features/notification-hub.slice/` — user.notification delivery + queries (2 files)
- `src/features/organization.slice/` — core, gov.members, gov.partners, gov.policy, gov.teams (5 files)
- `src/shared-infra/projection.bus/` — account-audit, account-view, org-eligible-member-view, organization-view, tag-snapshot, workspace-scope-guard, workspace-view (9 files)
- `src/features/workforce-scheduling.slice/` — aggregate, components, hooks, projectors, queries (9 files)
- `src/features/skill-xp.slice/` — projector, queries, tag-lifecycle (3 files)
- `src/features/workspace.slice/` — business.daily, business.document-parser, business.files, business.workflow, core, gov.audit (10 files)

**Any new code must NOT add to this list.** D24 migration requires a dedicated PR.

## Workflow for Architecture Alignment

Before making changes, always follow the architecture alignment prompts:

1. **`.github/prompts/compliance-audit.prompt.md`** — run before PR to verify docs alignment
2. **`.github/prompts/iterative-alignment-refactor.prompt.md`** — for fixing D-rule violations

## Prompt Routing Guard (MANDATORY)

- Use **`.github/prompts/x-repomix-bootstrap.prompt.md`** only for machine bootstrap (`node`, `npm`, `repomix` install/verify).
- For structure refactor, D-rule remediation, or slice migration, use **`.github/prompts/x-arch-remediation.prompt.md`**.
- If the request includes terms like `結構化`, `重構`, `migrate`, `slice`, `D7/D3/D24`, do **not** run bootstrap prompts.

## Large Refactor Transaction Protocol (MANDATORY)

When moving files/folders across architecture layers:

1. Produce a file move map (source -> destination) before editing.
2. Move files in small batches (max 5 moves/batch).
3. After each batch, run diagnostics (`get_errors`) and stop on first regression.
4. Create backward-compatibility shims only after real files are moved and imports are fixed.
5. Do not leave dual structures (`new layer folders + old runtime folders`) without an explicit TODO plan.
6. If any tool action is cancelled or fails, stop and report partial state before continuing.

## Key Files

- `docs\architecture\00-LogicOverview.md` — **SSOT** architecture rules (D1–D25, invariants #1–#19)
- `eslint.config.mts` — enforces D1–D25 as ESLint rules
- `.github/copilot-instructions.md` — agent workflow instructions
- `.github/prompts/compliance-audit.prompt.md` — architecture compliance prompt
- `.github/prompts/iterative-alignment-refactor.prompt.md` — iterative alignment refactor prompt
