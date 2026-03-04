# src/app — Entry & Navigation Layer

## Architecture Role

`src/app` is the **outermost entry layer (L0 → L2 boundary)** of the system. It owns all Next.js App Router route segments, root layouts, and global CSS. Its sole purpose is to map HTTP surface area to feature slices and runtime providers — it must **never contain business logic**.

```
L0 External Triggers
  └─> src/app  (route declaration + layout wiring)
        └─> src/app-runtime  (providers)
              └─> src/features  (domain slices)
```

---

## Directory Structure

```
src/app/
├── (public)/               # Unauthenticated routes
│   ├── login/              # VS1 Identity — sign-in page
│   └── reset-password/
│       └── @modal/         # Parallel route slot — modal overlay
│
├── (shell)/                # Authenticated shell layout
│   ├── layout.tsx          # Shell wrapper: injects WorkspaceProvider, sidebar
│   ├── @sidebar/           # Parallel route slot — sidebar
│   │   └── default.tsx
│   │
│   └── (account)/          # Sub-route group for account pages
│       ├── layout.tsx
│       └── (dashboard)/    # Dashboard and workspace pages
│           └── (workspaces)/
│
├── layout.tsx              # Root layout — mounts <Providers> from app-runtime
├── globals.css             # Global CSS reset / design tokens
└── favicon.ico
```

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/app` → `src/app-runtime` (providers wiring) |
| ✅ Allowed | `src/app` → `src/features/{slice}/index.ts` (public API only) |
| ✅ Allowed | `src/app` → `src/shared` (UI components, utils) |
| ✅ Allowed | `src/app` → `src/config` (env flags, route constants) |
| ❌ Forbidden | Any layer importing **from** `src/app` |
| ❌ Forbidden | `src/app` importing directly from `src/features/{slice}/_*` private files |
| ❌ Forbidden | `src/app` calling Firebase SDK directly — must go through `SK_PORTS` [D24] |

---

## Route Structure

### Public Group `(public)`

Routes accessible without authentication. They must not import any authenticated feature slice.

| Segment | Feature Slice | Notes |
|---------|--------------|-------|
| `/login` | VS1 Identity | Triggers `authenticated-identity` flow |
| `/reset-password` | VS1 Identity | Uses `@modal` parallel slot for overlay UI |

### Shell Group `(shell)`

Authenticated routes wrapped in a layout that mounts the sidebar and workspace context.

| Segment | Feature Slice | Notes |
|---------|--------------|-------|
| `/dashboard` | VS2 Account, VS5 Workspace | Main dashboard |
| `/workspaces/[id]` | VS5 Workspace | Workspace detail pages |

---

## Layout & Middleware Responsibilities

### `layout.tsx` (root)

- Imports `<Providers>` from `src/app-runtime` and wraps the entire page tree.
- Defines root `<html>` / `<body>` structure, font loading (`next/font`), and global `<Metadata>`.
- **No business logic.** Route-specific metadata lives in each `page.tsx`.

### `(shell)/layout.tsx`

- Mounts the authenticated shell: sidebar slot, workspace status bar.
- Responsible for session guard: redirects to `/login` on unauthenticated access via middleware or server-side check.

### Parallel Route Slots (`@modal`, `@sidebar`)

Slots follow Next.js parallel routes semantics — they render independently alongside their sibling `page.tsx`. Use `default.tsx` to render `null` when the slot is not active.

---

## Metadata Convention

Each `page.tsx` may export a `generateMetadata` function or a static `metadata` object per [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata). Title templates follow:

```
"<Page Title> | Xuanwu"
```

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| No business logic in route files | ✅ | All logic delegated to feature slice hooks/actions |
| No direct Firebase import | ✅ | Firebase access via `src/shared/infra` adapters only |
| Cross-slice references via `index.ts` only | ✅ | `[D7]` enforced by ESLint |
| `(public)` routes contain no authenticated logic | ✅ | — |
| Middleware redirects unauthenticated users | ✅ | Handled in `(shell)/layout.tsx` |
