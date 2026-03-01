---
name: webapp-testing
description: Toolkit for interacting with and testing local web applications using Playwright MCP tools. Use when asked to verify frontend functionality, debug UI behavior, capture browser screenshots, check for visual regressions, or view browser console logs. Supports Chrome, Firefox, and WebKit browsers.
---

# Web Application Testing

This skill enables browser automation and E2E testing using the **Playwright MCP tools** (`playwright-browser_*`).

## ⚠️ Use `playwright-browser_*` MCP tools directly

Do **NOT** use `next-devtools-browser_eval` or `browser_eval` with `action: "evaluate"` for testing:
- They lock the browser, making `playwright-browser_snapshot` unavailable
- Code runs inside browser context where the `page` object does not exist

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

`playwright-browser_navigate` and `playwright-browser_snapshot` return a YAML accessibility tree with `ref` values:

```yaml
- textbox "Email" [ref=e49]
- textbox "Password" [ref=e51]
- button "Sign In" [ref=e52]
```

Use those refs in `click`, `type`, and `fill_form`. After any navigation, call `playwright-browser_snapshot` to get fresh refs.

## Standard Workflow

```
1. playwright-browser_navigate { url: "http://localhost:9002/login" }
   → snapshot in response shows element refs

2. playwright-browser_fill_form {
     fields: [
       { name: "email", type: "textbox", ref: "e49", value: "test@demo.com" },
       { name: "password", type: "textbox", ref: "e51", value: "123456" }
     ]
   }

3. playwright-browser_click { element: "Sign In button", ref: "e52" }

4. playwright-browser_wait_for { text: "Dashboard" }

5. playwright-browser_snapshot   ← get fresh refs after navigation

6. playwright-browser_console_messages   ← check for errors

7. playwright-browser_take_screenshot { fullPage: true }
```

## Test Credentials (Dev/Test only)

- Login: `test@demo.com` / `123456`
- Registration: `demo{n}` / `test{n}@demo.com` / `123456`

## When to Use This Skill

- Login, registration, and authentication flows
- Form submission and validation
- Navigation and routing verification
- Console error detection
- Visual screenshot capture
- UI interaction testing
