# @reports — Account Audit Timeline Slot

Parallel route slot consumed by `dashboard/layout.tsx`.

- **`page.tsx`** — Renders `AccountAuditComponent` (recent technical-spec changes). Only active at the `/dashboard` root segment.
- **`default.tsx`** — Returns `null` so the slot gracefully disappears on sub-routes like `/dashboard/account/audit`. Prevents a 404 on hard navigation.
- **`loading.tsx`** — Skeleton rows shown while the client island hydrates.

> 獨立 Slot B (報表清單)