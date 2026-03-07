# src/features/portal.slice — Portal Feature Domain Slice

## Architecture Role

`portal.slice` is the **portal domain feature slice (VS-Portal)**. It owns all business logic, state management, actions, and queries for the portal and shell layers. It is the authoritative source of domain rules for the public-facing portal and the authenticated application shell.

```
src/portal  /  src/app/(shell)     (presentation layers — consume this slice)
  └─> src/features/portal.slice      ← THIS LAYER (domain logic)
        └─> src/shared/infra         (Firebase ACL adapters via SK_PORTS)
        └─> src/features/shared-kernel  (contracts)
```

---

## Directory Structure

```
src/features/portal.slice/
├── README.md
├── index.ts                    # Public API barrel — ONLY export from here [D7]
├── _types.ts                   # Domain type definitions
└── core/                       # Core portal domain
    ├── _actions.ts             # Mutations / commands [D3]
    ├── _queries.ts             # Read queries / subscriptions
    └── _hooks/                 # React hooks (presentation bridge)
        └── use-portal-state.ts
```

---

## Responsibilities

- **Domain actions**: All portal write operations go through `_actions.ts` [D3].
- **Domain queries**: All portal read operations go through `_queries.ts`.
- **Type ownership**: Portal-specific domain types are defined in `_types.ts` [D19/D20].
- **No Firebase imports**: All Firestore/Auth access goes through `SK_PORTS` port interfaces [D24].

---

## Architecture Rules

| Rule | Description |
|------|-------------|
| [D3] | All mutations via `_actions.ts` — never call Firestore directly from components |
| [D7] | External consumers import only from `portal.slice/index.ts` — never from `_*` private files |
| [D24] | No `import ... from 'firebase/*'` anywhere in this slice |
| [D19/D20] | Domain types defined here, not in `src/shared/types` |
| [R8] | `traceId` injected once at CBG_ENTRY; never regenerated inside this slice |
| [S2] | All Firestore writes apply `applyVersionGuard()` before writing |

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `portal.slice` → `src/features/shared-kernel` (contracts, port interfaces) |
| ✅ Allowed | `portal.slice` → `src/shared/ports` (`SK_PORTS` interfaces only, not concrete adapters) |
| ✅ Allowed | `portal.slice` → `src/config` (env flags, constants) |
| ❌ Forbidden | `portal.slice` importing `firebase/*` directly [D24] |
| ❌ Forbidden | `portal.slice` importing from another feature slice's `_*` private files [D7] |
| ❌ Forbidden | Any presentation layer importing from `portal.slice/_*` private files [D7] |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| Public API exported only from `index.ts` | ✅ | `[D7]` enforced by ESLint |
| No direct Firebase SDK import | ✅ | All via `SK_PORTS` [D24] |
| Types owned locally in `_types.ts` | ✅ | Not in `src/shared/types` [D19/D20] |
| Mutations only in `_actions.ts` | ✅ | `[D3]` pattern |
