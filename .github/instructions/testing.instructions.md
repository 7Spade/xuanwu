---
applyTo: '**/*.{ts,tsx,js,jsx}'
description: 'Integrated testing instructions: use Playwright MCP for UI/E2E validation and next-devtools MCP for RSC/route diagnostics. Single source of truth — replaces playwright-e2e-testing and playwright-mcp-testing files.'
---

# Integrated Testing Instructions

## Tool Selection Guide

| Scenario | Primary Tool |
|----------|-------------|
| UI interaction, login/registration flows | Playwright MCP |
| Console errors, network failures, screenshots | Playwright MCP |
| Visual verification and full-page E2E flows | Playwright MCP |
| RSC boundary analysis (Server/Client splits) | next-devtools MCP |
| Parallel Route `@slot` validation | next-devtools MCP |
| Suspense/Streaming behavior analysis | next-devtools MCP |
| Build/compilation errors | next-devtools MCP |
| Hydration mismatch (symptoms → root cause) | Playwright first, then next-devtools |

## Test Credentials (Dev/Test Environment Only)

- **Login:** `test@demo.com` / `123456`
- **Registration:** `demo{n}` / `test{n}@demo.com` / `123456` (e.g. `demo1` / `test1@demo.com`)

Use only in local/dev environments. Rotate credentials in any shared or staging environment and load them from secure secret storage.

---

## Playwright MCP Workflow

### Setup: Console Monitoring First

Always attach console/error listeners **before** any navigation:

```typescript
const errors: string[] = [];
const warnings: string[] = [];

page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
  if (msg.type() === 'warning') warnings.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));
```

### Standard Steps

1. **Navigate** to target route (e.g. `/login`, `/dashboard`, `/dashboard/workspaces`)
2. **Authenticate** if required using test credentials above
3. **Collect diagnostics** before interacting:
   - Page snapshot (a11y tree)
   - Browser console messages
   - Failed network requests
   - Full-page screenshot
4. **Interact** using explicit waits and stable selectors (`data-testid` preferred)
5. **Verify** expected outcome (URL pattern, element presence, zero console errors)
6. **Summarize** issues by priority (see below)

### Required Route Coverage (minimum)

- `/login`
- `/dashboard`
- `/dashboard/account/settings`
- `/dashboard/workspaces`
- One `/dashboard/workspaces/[id]` reached via UI navigation

### Bottleneck Priority Order

1. Functional breakage / runtime exceptions
2. Hydration failures
3. Repeated network failures (4xx/5xx)
4. Slow render / blocking loading states

### Fix Principles

- Identify and document root cause before patching symptoms
- Apply the smallest change that fully resolves the root cause
- Preserve existing behavior and component contracts
- Re-run the same scenario to verify no regressions
- Prefer SSR-safe fixes over client-only workarounds
- Keep architecture boundaries intact: `app → components → context → hooks → infra → lib → types`

### Common Patterns

**Wait for element:**
```typescript
await page.waitForSelector('#element-id', { state: 'visible' });
```

**Check element exists:**
```typescript
const exists = await page.locator('#element-id').count() > 0;
```

**Screenshot for debugging:**
```typescript
await page.screenshot({ path: `/tmp/debug-${Date.now()}.png`, fullPage: true });
```

**Error summary at end of test:**
```typescript
console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
if (errors.length) errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
```

---

## next-devtools MCP Workflow

Use next-devtools when you need to diagnose Next.js internals **without a browser session**, or to trace the root cause of hydration/RSC errors found via Playwright.

### When to Choose next-devtools

- Error originates in server-side rendering or RSC execution
- A route slot is missing or not rendering in a Parallel Route layout
- Hydration mismatch needs to be traced to its component boundary
- You need build/compilation diagnostics or runtime route analysis

### Steps

1. **Check RSC boundaries** — Verify Server/Client Component splits are optimal; look for unnecessary `'use client'` at layout or route level
2. **Validate `@slot` routes** — Confirm Parallel Route segments render correctly and default slots exist where needed
3. **Analyze Suspense/Streaming** — Confirm Suspense boundaries are placed to maximize streaming benefits
4. **Check build errors** — Get compilation errors directly from the dev server MCP endpoint

---

## Evidence Requirements

For every meaningful fix retain:

- Before/after screenshot (Playwright)
- Before/after console error count
- Root cause note and exact fix applied

---

## Related Files

- **Testing Prompt:** `.github/prompts/playwright-mcp-web-test-and-optimize.prompt.md`
- **next-devtools Atomic Wrapper:** `.github/prompts/next-devtools.prompt.md`
- **Browser Tester Agent:** `.github/agents/gem-browser-tester.agent.md`
- **Webapp Testing Skill:** `.github/skills/webapp-testing/SKILL.md`
- **Route Diagnostics Prompt:** `.github/prompts/route-audit-diagnostics.prompt.md`
