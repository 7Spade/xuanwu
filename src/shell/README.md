# src/shell — Application Shell Assembly Layer

## Architecture Role

`src/shell` is the **application shell assembly layer**. It assembles the full application frame by composing portal page logic (`src/portal`) with authenticated feature slices. It owns the navigational chrome, authenticated layout wrappers, and cross-cutting UI concerns shared across all authenticated routes.

```
src/app/(shell)    (route declarations)
  └─> src/shell   ← THIS LAYER (shell assembly)
        └─> src/portal               (official page components)
        └─> src/features/{slice}     (feature domain outputs)
        └─> src/shared               (common UI / utilities)
```

---

## Directory Structure

```
src/shell/
├── README.md
├── index.ts                    # Public API barrel — only export from here
├── app-shell.tsx               # Authenticated application shell root
└── _components/                # Shell-specific UI components
    ├── shell-header.tsx        # Top navigation bar
    └── shell-sidebar.tsx       # Side navigation panel
```

---

## Responsibilities

- **Shell composition**: Assembles portal layout + authenticated feature UI into a unified navigable application.
- **Authenticated frame**: Owns the visual chrome (sidebar, header, breadcrumbs) for all authenticated routes.
- **Cross-cutting shell concerns**: Loading states, error boundaries, theme transitions — at the frame level.
- **No business logic**: All domain commands flow through feature slices. This layer only orchestrates layout.

---

## Relationship to `src/portal`

| Layer | Role |
|-------|------|
| `src/portal` | Defines **what** the official pages contain (components, page logic) |
| `src/shell` | **Assembles** those pages into a navigable application shell |

The shell layer imports and wraps portal components to provide navigational context, auth guards, and global providers that portal pages themselves should not need to know about.

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/shell` → `src/portal` (portal layout components) |
| ✅ Allowed | `src/shell` → `src/features/{slice}` (public API only) |
| ✅ Allowed | `src/shell` → `src/shared` (UI components, utilities) |
| ✅ Allowed | `src/shell` → `src/config` (env flags, route constants) |
| ❌ Forbidden | Feature slices or portal importing **from** `src/shell` |
| ❌ Forbidden | `src/shell` importing from `src/features/{slice}/_*` private files [D7] |
| ❌ Forbidden | `src/shell` calling Firebase SDK directly [D24] |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| Shell assembles, not owns, business logic | ✅ | Domain logic stays in feature slices |
| No direct Firebase import | ✅ | Firebase access via `SK_PORTS` adapters only [D24] |
| Cross-slice references via `index.ts` only | ✅ | `[D7]` enforced by ESLint |
