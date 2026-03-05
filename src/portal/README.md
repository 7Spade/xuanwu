# src/portal — Official Page Logic Layer

## Architecture Role

`src/portal` is the **official page logic layer**. It owns all public-facing page components, portal layouts, and presentation logic for the official site experience. It assembles UI from feature slice outputs and shared components, but contains **no business logic or domain commands**.

```
L0 External Triggers
  └─> src/app/(public)    (route declarations)
        └─> src/portal    ← THIS LAYER (official page components)
              └─> src/features/portal.slice  (domain logic)
              └─> src/shared                 (common UI / utilities)
```

---

## Directory Structure

```
src/portal/
├── README.md
├── index.ts                    # Public API barrel — only export from here
├── portal-layout.tsx           # Root portal layout wrapper
└── _pages/                     # Page-level portal components
    ├── home-page.tsx           # Landing / home page
    └── not-found-page.tsx      # 404 page
```

---

## Responsibilities

- **Page composition**: Assembles feature slice outputs (hooks, components) into full portal pages.
- **Portal layout**: Owns the visual frame (header, footer, navigation) for the public-facing portal.
- **No business logic**: All domain commands go through `src/features/portal.slice`. This layer only renders.

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/portal` → `src/features/portal.slice` (public API only) |
| ✅ Allowed | `src/portal` → `src/shared` (UI components, utilities) |
| ✅ Allowed | `src/portal` → `src/config` (env flags, route constants) |
| ❌ Forbidden | Any lower layer importing **from** `src/portal` |
| ❌ Forbidden | `src/portal` importing directly from `src/features/{slice}/_*` private files [D7] |
| ❌ Forbidden | `src/portal` calling Firebase SDK directly [D24] |
| ❌ Forbidden | Business logic, domain aggregates, or use-case commands in this layer |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| No business logic in page components | ✅ | All logic delegated to `portal.slice` hooks/actions |
| No direct Firebase import | ✅ | Firebase access via `SK_PORTS` adapters only [D24] |
| Cross-slice references via `index.ts` only | ✅ | `[D7]` enforced by ESLint |
