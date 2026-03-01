---
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js'
description: 'Playwright MCP (playwright-browser_* tools) for browser-based E2E testing. next-devtools MCP (nextjs_index/nextjs_call) for RSC/route server diagnostics. Do NOT call browser_eval with action:evaluate during a Playwright snapshot flow — it locks the browser.'
---

# Playwright MCP Testing

Use the `playwright-browser_*` MCP tools for all browser-based testing.

> ⚠️ Do **NOT** use `next-devtools-browser_eval` with `action: "evaluate"` during a Playwright MCP flow — it locks the browser and makes `playwright-browser_snapshot` unavailable.
>
> `next-devtools-nextjs_index` / `next-devtools-nextjs_call` query the **Next.js dev server** (not the browser) and are **safe to use alongside Playwright**.

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

`playwright-browser_navigate` and `playwright-browser_snapshot` return a YAML accessibility tree:

```yaml
- textbox "Email" [ref=e49]
- textbox "Password" [ref=e51]
- button "Sign In" [ref=e52]
```

Use those refs in `click`, `type`, and `fill_form` calls. **Re-snapshot after every navigation** to get fresh refs.

## Standard Workflow

1. `playwright-browser_navigate` → get initial snapshot with element refs
2. `playwright-browser_fill_form` → fill credentials using refs from snapshot
3. `playwright-browser_click` → click submit using its ref
4. `playwright-browser_wait_for` → confirm page loaded
5. `playwright-browser_snapshot` → get fresh refs for new page
6. `playwright-browser_console_messages` → check for errors
7. `playwright-browser_take_screenshot` → capture visual evidence

## Test Credentials (Dev/Test only)

- Login: `test@demo.com` / `123456`

## Required Route Coverage (minimum)

- `/login`
- `/dashboard`
- `/dashboard/account/settings`
- `/dashboard/workspaces`
- One `/dashboard/workspaces/[id]` reached via UI navigation
