---
applyTo: '**/*.{ts,tsx,js,jsx}'
description: 'Use Playwright MCP (playwright-browser_* tools) for browser-based E2E testing. Do not use browser_eval or next-devtools-browser_eval.'
---

# Testing with Playwright MCP

Use the `playwright-browser_*` MCP tools for all browser-based testing.

> ⚠️ Do **NOT** use `next-devtools-browser_eval` or `browser_eval` with `action: "evaluate"` — they lock the browser and make `playwright-browser_snapshot` unavailable.

## Tool Reference

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

## Test Credentials (Dev/Test only)

- Login: `test@demo.com` / `123456`

## Required Route Coverage (minimum)

- `/login`
- `/dashboard`
- `/dashboard/account/settings`
- `/dashboard/workspaces`
- One `/dashboard/workspaces/[id]` via UI navigation
