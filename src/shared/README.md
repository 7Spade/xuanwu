# src/shared — Common Utilities Layer

## Architecture Role

`src/shared` is the **stateless common library layer**. It provides UI components, helper functions, domain types, port interfaces, and constants that are shared across all layers above it. Everything in `src/shared` must be **side-effect-free** — no Firebase calls, no business commands, no React state that represents domain state.

```
src/app               (routes)
src/app-runtime       (providers)
src/features          (domain slices)
  └──> src/shared   ← THIS LAYER (all layers above depend on this)
         └──> src/config
```

---

## Directory Structure

```
src/shared/
├── README.md
├── app-providers/          # Reusable React context providers (shared, not app-specific)
│   ├── auth-provider.tsx
│   ├── firebase-provider.tsx
│   ├── theme-provider.tsx
│   └── app-context.tsx
│
├── constants/              # Project-wide non-environment constants
│   ├── routes.ts           # Typed route path constants
│   ├── roles.ts            # Role/permission constants
│   ├── status.ts           # Status enumerations
│   ├── skills.ts
│   ├── settings.ts
│   ├── taiwan-address.ts
│   └── location-units.ts
│
├── enums/                  # Shared TypeScript enums
│
├── infra/                  # Firebase ACL adapters [L7, D24]
│   ├── auth/               # AuthAdapter — implements IAuthService
│   ├── firestore/          # FirestoreAdapter — implements IFirestoreRepo
│   │   ├── firestore.facade.ts
│   │   ├── firestore.client.ts
│   │   ├── collection-paths.ts
│   │   ├── version-guard.middleware.ts
│   │   └── repositories/   # Per-domain Firestore repository implementations
│   ├── messaging/          # FCMAdapter — implements IMessaging
│   └── storage/            # StorageAdapter — implements IFileStore
│
├── lib/                    # Pure utility functions (no side effects)
│   ├── utils.ts
│   └── index.ts
│
├── ports/                  # SK_PORTS — infrastructure port interfaces
│   ├── i-auth.service.ts   # IAuthService
│   ├── i-firestore.repo.ts # IFirestoreRepo
│   ├── i-messaging.ts      # IMessaging
│   ├── i-file-store.ts     # IFileStore
│   └── index.ts
│
├── shadcn-ui/              # shadcn/ui component library (excluded from ESLint)
│
├── types/                  # Cross-domain shared TypeScript types
│   ├── account.types.ts
│   ├── workspace.types.ts  # ParsingIntent, Task, Workflow types
│   ├── audit.types.ts      # ← re-exports from workspace.slice (compat stub)
│   ├── daily.types.ts      # ← re-exports from workspace.slice (compat stub)
│   ├── task.types.ts       # ← re-exports from workspace.slice (compat stub)
│   ├── schedule.types.ts
│   ├── skill.types.ts
│   └── index.ts
│
└── ui/                     # Custom shared React components (not shadcn)
    ├── language-switcher.tsx
    └── page-header.tsx
```

---

## `src/shared/infra` — Firebase ACL Adapters [L7]

The `infra/` subdirectory implements the **Anti-Corruption Layer (ACL)** for all Firebase SDK access [D24]. Each adapter:

1. Implements exactly one `SK_PORTS` port interface.
2. Is the **only** place in the codebase that may import `firebase/*`.
3. Never generates a new `traceId` — it propagates `envelope.traceId` from the caller [R8].

| Adapter | Implements | Firebase package |
|---------|-----------|-----------------|
| `auth/auth.adapter.ts` | `IAuthService` | `firebase/auth` |
| `firestore/firestore.facade.ts` | `IFirestoreRepo` | `firebase/firestore` |
| `messaging/` | `IMessaging` | `firebase/messaging` |
| `storage/` | `IFileStore` | `firebase/storage` |

**[S2] Firestore version guard:** `firestore.facade.ts` enforces monotonically-increasing `aggregateVersion` using `version-guard.middleware.ts` before every write.

---

## `src/shared/ports` — SK_PORTS

Port interfaces define **what** the infrastructure must do, **not how**. Feature slices depend on these interfaces, never on concrete adapters:

```ts
// ✅ Feature slice injects port interface
import type { IFirestoreRepo } from '@/shared/ports'

// ❌ Feature slice must NOT import concrete adapter
import { firestoreFacade } from '@/shared/infra/firestore/firestore.facade'
```

---

## `src/shared/types` — Shared Type Definitions

Cross-domain types live here. Some files are **compatibility stubs** that re-export from their owning feature slice to avoid circular dependencies:

| File | Owner | Notes |
|------|-------|-------|
| `workspace.types.ts` | VS5 workspace.slice | Canonical — ParsingIntent v2, Task, Workflow |
| `audit.types.ts` | VS5 workspace.slice | Compat re-export stub |
| `daily.types.ts` | VS5 workspace.slice | Compat re-export stub |
| `task.types.ts` | VS5 workspace.slice | Compat re-export stub |
| `account.types.ts` | VS2 account.slice | Canonical here |
| `schedule.types.ts` | VS6 scheduling.slice | Canonical here |
| `skill.types.ts` | VS7 skill-xp.slice | Canonical here |

---

## `src/shared/shadcn-ui` — shadcn/ui Components

shadcn/ui components live in `src/shared/shadcn-ui/`. This directory is **excluded from ESLint** to avoid conflicts with generated component code. Do not add custom business logic to these files.

Usage convention:

```ts
// ✅ Import shadcn/ui components
import { Button } from '@/shared/shadcn-ui/button'
import { Dialog, DialogContent } from '@/shared/shadcn-ui/dialog'
```

---

## `src/shared/lib` — Pure Utility Functions

`lib/utils.ts` provides pure, side-effect-free utilities. All functions must be:

- Deterministic (same input → same output).
- Free of network calls, Firebase reads, or React state mutations.
- Testable in isolation without mocking.

---

## `src/shared/constants` — Project-Wide Constants

Global constants that are **not** environment-dependent and are referenced across multiple layers. Environment-dependent values belong in `src/config`.

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/shared` → `src/config` |
| ✅ Allowed | `src/shared/infra` → `firebase/*` (ACL adapters only) [D24] |
| ❌ Forbidden | `src/shared` importing from `src/features` (except compat type stubs) |
| ❌ Forbidden | `src/shared` importing from `src/app` or `src/app-runtime` |
| ❌ Forbidden | Any layer other than `src/shared/infra` importing `firebase/*` [D24] |
| ❌ Forbidden | Feature slices importing concrete Firebase adapters directly — use `SK_PORTS` |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| Firebase ACL adapters isolated in `infra/` | ✅ | [D24] enforced by ESLint |
| Port interfaces decoupled from implementations | ✅ | `ports/` vs `infra/` separation |
| `shadcn-ui/` excluded from ESLint | ✅ | `eslint.config.mts` lines 22-30 |
| `lib/utils.ts` contains only pure functions | ✅ | No side effects |
| Type compatibility stubs clearly documented | ✅ | Compat stubs re-export from owning slice |
| Version guard on all Firestore writes | ✅ | `version-guard.middleware.ts` [S2] |
| `traceId` propagated from envelope — never regenerated | ✅ | `firestore.facade.ts` [R8] |
