---
name: webapp-testing
description: Toolkit for testing Next.js applications using Playwright MCP (UI/E2E flows) and next-devtools MCP (RSC/route diagnostics). Use when asked to verify frontend functionality, debug UI behavior, capture screenshots, inspect browser logs, or diagnose RSC boundaries and Parallel Route slots.
---

# Web Application Testing

This skill enables comprehensive testing and debugging using two complementary MCP tools:

- **Playwright MCP** — browser automation for UI/E2E flows
- **next-devtools MCP** — Next.js runtime diagnostics for RSC, routes, and builds

## When to Use This Skill

| Need | Tool |
|------|------|
| Login/registration flows, form interactions | Playwright MCP |
| Visual verification, screenshots, console logs | Playwright MCP |
| Network request monitoring | Playwright MCP |
| RSC boundary analysis (Server/Client splits) | next-devtools MCP |
| Parallel Route `@slot` validation | next-devtools MCP |
| Suspense/Streaming behavior | next-devtools MCP |
| Build/compilation errors | next-devtools MCP |

## Prerequisites

- Dev server running on port 9002 (`npm run dev`)
- Next.js 16+ (for next-devtools MCP endpoint at `/_next/mcp`)

## Test Credentials (Dev/Test only)

- Login: `test@demo.com` / `123456`
- Registration: `demo{n}` / `test{n}@demo.com` / `123456`

## Standard Workflow

Follow the complete workflow in `.github/instructions/testing.instructions.md`:

1. **Playwright baseline** — attach console listeners, navigate to `/login`, authenticate
2. **Route sweep** — `/dashboard`, `/dashboard/account/settings`, `/dashboard/workspaces`, one workspace detail
3. **next-devtools diagnostics** — RSC boundaries, `@slot` validation, Suspense analysis
4. **Fix from root cause** — smallest change that resolves the root cause, re-verify

## Common Patterns (Playwright)

```javascript
// Console monitoring (attach BEFORE navigation)
page.on('console', msg => {
  if (msg.type() === 'error') console.error('Browser Error:', msg.text());
});

// Wait for element
await page.waitForSelector('[data-testid="account-switcher"]', { state: 'visible' });

// Screenshot for debugging
await page.screenshot({ path: '/tmp/debug.png', fullPage: true });

// Check element exists
const exists = await page.locator('#element-id').count() > 0;
```

## Guidelines

1. Use `data-testid` selectors over CSS classes or text for stability
2. Always wait for elements before interacting — never assume instant rendering
3. Attach console listeners before any navigation step
4. Take screenshots on failures to document state
5. Prefer next-devtools for any error that originates server-side
6. Run Playwright after next-devtools fixes to confirm no regressions

## Limitations

- Playwright MCP requires the dev server running on port 9002
- next-devtools MCP requires Next.js 16+ with MCP enabled (default in v16)
- Cannot test native mobile apps
