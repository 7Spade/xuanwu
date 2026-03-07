# @analytics — Dimension Stat Cards Slot

Parallel route slot consumed by `dashboard/layout.tsx`.

- **`page.tsx`** — Renders `StatCards` (dimension consistency, activity pulse, capability load). Only active at the `/dashboard` root segment.
- **`default.tsx`** — Returns `null` so the slot gracefully disappears on sub-routes like `/dashboard/account/settings`. Prevents a 404 on hard navigation.
- **`loading.tsx`** — Three skeleton cards shown while the client island hydrates.

> 獨立 Slot A (統計圖表)