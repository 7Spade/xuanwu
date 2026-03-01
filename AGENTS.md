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

- **`npm run lint`** — zero errors (warnings about existing D24 SDK calls are expected and tracked)
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

## Key Files

- `docs/logic-overview.md` — SSOT architecture rules (D1–D25, invariants #1–#19)
- `eslint.config.mts` — enforces D1–D25 as ESLint rules
- `.github/copilot-instructions.md` — agent workflow instructions
