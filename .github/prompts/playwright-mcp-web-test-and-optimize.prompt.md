---
agent: 'agent'
tools: ['edit/editFiles', 'playwright-browser_*', 'next-devtools', 'bash']
description: 'Integrated testing prompt: run Playwright MCP for UI/E2E validation and next-devtools MCP for RSC/route diagnostics. Diagnose bottlenecks and apply root-cause-safe fixes.'
---

# Integrated Test, Diagnose, Fix & Optimize

Use this prompt for full browser-based validation (Playwright MCP) combined with Next.js runtime diagnostics (next-devtools MCP).

## Test Credentials (Dev/Test only)

- Email: `test@demo.com` / Password: `123456`
- Registration: `demo{n}` / `test{n}@demo.com` / `123456`

Never reuse for staging/production. Load credentials from secure secret storage in shared environments.

## Tool Strategy

| Phase | Tool |
|-------|------|
| Login, forms, UI interactions | Playwright MCP |
| Console errors, screenshots, network | Playwright MCP |
| RSC boundary / Server-Client split | next-devtools MCP |
| Parallel Route `@slot` validation | next-devtools MCP |
| Suspense/Streaming analysis | next-devtools MCP |
| Build/compilation errors | next-devtools MCP |
| Hydration mismatch root cause | Playwright (symptoms) + next-devtools (root cause) |

## Mandatory Steps

### A. Baseline Check (Playwright)

- Navigate to `/login`
- Authenticate with test credentials
- Capture: console errors/warnings, failed network requests, screenshot

### B. Route Sweep (Playwright)

For each of `/dashboard`, `/dashboard/account/settings`, `/dashboard/workspaces`, one `/dashboard/workspaces/[id]`:

- Wait for stable render
- Detect loading deadlocks, hydration errors, broken interactions
- Capture a11y snapshot and screenshot

### C. RSC & Route Diagnostics (next-devtools)

- Check RSC boundary placement (look for unnecessary `'use client'` at layout level)
- Validate `@slot` Parallel Routes render correctly
- Verify Suspense boundaries maximize streaming

### D. Bottleneck Analysis

Summarize issues by priority:

1. Functional breakage
2. Runtime exceptions / hydration failures
3. Repeated failed requests (4xx/5xx)
4. Slow interactions / blocking loading states

### E. Fix and Optimize

- Apply root-cause, behavior-preserving fixes
- Prefer existing project patterns and components
- Keep architecture boundaries intact: `app → components → context → hooks → infra → lib → types`

### F. Verification Loop

- Re-run baseline + route sweep on changed areas
- Confirm: issue resolved, no new console errors, no broken critical path

## Output Format

1. **Issue List**: route + symptom + root cause + tool used
2. **Patch Summary**: exact files changed and why
3. **Verification Evidence**: before/after screenshots + console error delta
4. **Residual Risk**: known limits or follow-up recommendations
