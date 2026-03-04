# src/app-runtime — Runtime Isolation Layer

## Architecture Role

`src/app-runtime` is the **runtime wiring layer** that sits between the route entry (`src/app`) and the business domain (`src/features`). It initializes all React context providers, connects environment configuration to the application tree, and manages client-side lifecycle hooks.

```
src/app              (route declarations)
  └─> src/app-runtime  ← THIS LAYER
        ├── providers/     (React Context wiring)
        ├── contexts/      (global runtime state)
        └── ai/            (Genkit AI runtime)
              └─> src/features / src/shared / src/config
```

**No business logic belongs here.** This layer only wires infrastructure together.

---

## Directory Structure

```
src/app-runtime/
├── README.md
├── providers/
│   └── README.md          # Provider composition root
├── contexts/
│   └── README.MD          # Runtime React context definitions
└── ai/
    ├── genkit.ts           # Genkit AI client initialization
    ├── dev.ts              # Development-only AI tooling
    ├── index.ts
    ├── flows/              # AI flow definitions (server-side)
    └── schemas/            # Zod schemas for AI input/output contracts
```

---

## Provider Injection Order

Providers in `src/app-runtime/providers/` must be composed **from outermost to innermost** according to their dependency order. The canonical composition is:

```
<FirebaseProvider>           ← src/shared/app-providers/firebase-provider.tsx
  <AuthProvider>             ← src/shared/app-providers/auth-provider.tsx
    <ThemeProvider>          ← src/shared/app-providers/theme-provider.tsx
      <AppContext>           ← src/app-runtime/contexts/
        {children}
      </AppContext>
    </ThemeProvider>
  </AuthProvider>
</FirebaseProvider>
```

**Invariant:** A provider must never depend on a provider that appears below it in the tree.

---

## Global State Initialization

| Context / State | Location | Initialized From |
|-----------------|----------|-----------------|
| Firebase app instance | `src/shared/app-providers/firebase-provider.tsx` | `src/config/i18n` + `src/shared-infra/firebase` |
| Auth session | `src/shared/app-providers/auth-provider.tsx` | `IAuthService` port (`SK_PORTS`) |
| Theme | `src/shared/app-providers/theme-provider.tsx` | `localStorage` / system preference |
| AI runtime (Genkit) | `src/app-runtime/ai/genkit.ts` | Environment variables [D24] |

---

## AI Runtime (`ai/`)

The `ai/` subtree initializes [Genkit](https://firebase.google.com/docs/genkit) for server-side AI flows. It is isolated here so that AI model configuration never leaks into domain slices.

| File | Purpose |
|------|---------|
| `genkit.ts` | Configures Genkit instance with plugins and model defaults |
| `dev.ts` | Development server entry (runs flows locally) |
| `flows/` | Named Genkit flows — each flow is a pure async function |
| `schemas/` | Zod input/output schemas for type-safe flow contracts |

**Rule:** AI flows must not call Firebase SDK directly — they must use `SK_PORTS` adapters. [D24]

---

## Lifecycle Hooks

Runtime lifecycle is managed at this layer, not in individual features:

| Lifecycle Event | Handler Location | Action |
|-----------------|-----------------|--------|
| App mount | `providers/` composition root | Initialize Firebase, Auth, Theme |
| Auth state change | `auth-provider.tsx` | Update `active-account-context` (VS1) |
| Token refresh | `_token-refresh-listener.ts` in VS1 | Emit `TOKEN_REFRESH_SIGNAL` per [S6] |
| Organization switch | VS1 `context-lifecycle-manager` | Re-initialize workspace context |

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/app-runtime` → `src/config` |
| ✅ Allowed | `src/app-runtime` → `src/shared` |
| ✅ Allowed | `src/app-runtime` → `src/shared/infra` (via ports) |
| ✅ Allowed | `src/app-runtime` → `src/features/{slice}/index.ts` (public API only) |
| ❌ Forbidden | Any other layer importing **from** `src/app-runtime` (except `src/app`) |
| ❌ Forbidden | `src/app-runtime` importing directly from `firebase/*` [D24] |
| ❌ Forbidden | Business logic, domain aggregates, or use-case commands in this layer |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| No business logic in providers | ✅ | Providers only initialize infrastructure |
| Firebase access via SK_PORTS | ✅ | `firebase-provider.tsx` wraps `src/shared/infra` |
| Token refresh delegated to VS1 | ✅ | `_token-refresh-listener.ts` in `identity.slice` |
| AI flows isolated in `ai/` subtree | ✅ | Not accessible from feature slices directly |
| Provider injection order documented | ✅ | See above |
