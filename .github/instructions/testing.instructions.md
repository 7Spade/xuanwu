---
applyTo: '**/*.{ts,tsx,js,jsx}'
description: 'Testing workflow: Playwright MCP (playwright-browser_* tools) for browser/UI/E2E, next-devtools MCP (nextjs_index/nextjs_call) for RSC/route diagnostics. Use each for its purpose; never call browser_eval(action:evaluate) during a Playwright snapshot flow.'
---

# Testing with Playwright MCP + next-devtools MCP

Two independent MCPs serve different purposes and are used together in a full testing workflow.

> ⚠️ **Critical**: `browser_eval` with `action: "evaluate"` **locks the browser** and breaks subsequent `playwright-browser_snapshot` calls. Use `next-devtools-nextjs_index` / `next-devtools-nextjs_call` for server diagnostics — these do **not** touch the browser and are safe alongside Playwright.

## Tool Responsibilities

| Concern | Tool |
|---------|------|
| UI interactions (click, fill, type) | `playwright-browser_*` |
| Browser console errors | `playwright-browser_console_messages` |
| Visual verification / screenshots | `playwright-browser_take_screenshot` |
| Accessibility tree / element refs | `playwright-browser_snapshot` |
| RSC boundary / Server-Client split | `next-devtools-nextjs_call` |
| Parallel Route `@slot` validation | `next-devtools-nextjs_call` |
| Suspense/Streaming analysis | `next-devtools-nextjs_call` |
| Build / compilation errors | `next-devtools-nextjs_call` |
| Route listing / diagnostics | `next-devtools-nextjs_index` + `nextjs_call` |

## Playwright MCP Tool Reference

| Task | Tool |
|------|------|
| Open a URL | `playwright-browser_navigate { url }` |
| Get element refs (accessibility tree) | `playwright-browser_snapshot` |
| Click an element | `playwright-browser_click { element, ref }` |
| Type into a field | `playwright-browser_type { element, ref, text }` |
| Fill multiple fields | `playwright-browser_fill_form { fields: [{name, type, ref, value}] }` |
| Take a screenshot | `playwright-browser_take_screenshot { fullPage }` |
| Read console messages | `playwright-browser_console_messages` |
| Wait for text | `playwright-browser_wait_for { text }` |
| Press a key | `playwright-browser_press_key { key }` |

## How `ref` Values Work

`playwright-browser_navigate` and `playwright-browser_snapshot` return a YAML accessibility tree with `ref` values. Use those refs in `click`, `type`, and `fill_form`. **Re-snapshot after every navigation.**

```yaml
- textbox "Email" [ref=e49]
- textbox "Password" [ref=e51]
- button "Sign In" [ref=e52]
```

## Standard Workflow

1. `playwright-browser_navigate { url }` → snapshot returned with element refs
2. `playwright-browser_fill_form { fields }` → fill using refs
3. `playwright-browser_click { element, ref }` → submit
4. `playwright-browser_wait_for { text }` → confirm navigation
5. `playwright-browser_snapshot` → fresh refs for new page
6. `playwright-browser_console_messages` → check for errors
7. `playwright-browser_take_screenshot` → visual evidence
8. *(Optional)* `next-devtools-nextjs_call` → RSC/route diagnostics if SSR errors found

## Test Credentials (Dev/Test only)

- Login: `test@demo.com` / `123456`

## Required Route Coverage (minimum)

- `/login`
- `/dashboard`
- `/dashboard/account/settings`
- `/dashboard/workspaces`
- One `/dashboard/workspaces/[id]` via UI navigation
