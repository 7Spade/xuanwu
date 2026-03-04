# src/config — Configuration & Constants Layer

## Architecture Role

`src/config` is the **configuration and constants layer**. It centralizes all environment variables, internationalization (i18n) settings, feature flags, and project-wide constants. Every other layer reads configuration **from here** — no layer should read `process.env` directly outside this directory.

```
src/config              ← THIS LAYER
  └── i18n/             (language / locale settings)
  └── ...               (additional config modules)
```

---

## Directory Structure

```
src/config/
├── README.md
└── i18n/               # Internationalisation configuration
    └── ...             # Locale definitions, supported languages
```

---

## Responsibilities

### 1. Environment Variables

All `process.env.*` reads must be proxied through a typed config module in this directory. This enforces:

- **Type safety** — undefined values are caught at startup, not at runtime.
- **Default values** — sensible fallbacks are co-located with each variable.
- **Security** — `NEXT_PUBLIC_*` variables (client-visible) are never confused with server-only secrets.

```ts
// ✅ Correct pattern
import { appConfig } from '@/config'
const apiUrl = appConfig.firebaseProjectId

// ❌ Forbidden
const apiUrl = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

### 2. i18n (Internationalisation)

The `i18n/` subdirectory owns locale definitions and supported language lists. Components must import locale constants from here rather than hardcoding language codes.

### 3. Feature Flags

Feature flags are boolean constants defined in `src/config`. They control the rollout of experimental features without code changes.

```ts
export const featureFlags = {
  enableSemanticSearch: process.env.NEXT_PUBLIC_FF_SEMANTIC_SEARCH === 'true',
  enableAiDocParser:    process.env.NEXT_PUBLIC_FF_AI_DOC_PARSER   === 'true',
} as const
```

### 4. Global Constants

Non-environment constants that are referenced across multiple layers — route paths, pagination limits, status enumerations — live in `src/shared/constants` (shared across all layers). Config-specific constants (those that may differ per environment) stay here.

---

## Naming Conventions

| Variable type | Prefix / location | Visibility |
|--------------|-------------------|------------|
| Firebase SDK config | `NEXT_PUBLIC_FIREBASE_*` | Client + Server |
| Server-only API keys | `SECRET_*` or no prefix | Server only |
| Feature flags | `NEXT_PUBLIC_FF_*` | Client + Server |
| Staleness SLA constants | `SK_STALENESS_CONTRACT` in `src/features/shared-kernel` | Server |

> **[S4]** SLA values (e.g. `TAG_MAX_STALENESS`, `PROJ_STALE_CRITICAL`) must be imported from `SK_STALENESS_CONTRACT` in `src/features/shared-kernel`. They must **never** be hardcoded in config files or components.

---

## Third-Party API Configuration

Third-party SDK configuration objects (Firebase, Genkit, analytics) are assembled in this layer and passed to their respective providers in `src/app-runtime`. The raw credentials come from environment variables; the assembled config objects are typed and validated here.

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | All layers may import from `src/config` |
| ❌ Forbidden | `src/config` must not import from `src/features`, `src/app`, `src/app-runtime`, `src/shared`, or `src/shared-infra` |
| ❌ Forbidden | Reading `process.env` directly outside `src/config` modules |
| ❌ Forbidden | Hardcoding SLA numeric values — use `SK_STALENESS_CONTRACT` [S4] |

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| All `process.env` reads proxied through config | ✅ | Direct reads banned by convention |
| No imports from upper layers | ✅ | Config is a leaf node in the dependency graph |
| i18n locale config centralised here | ✅ | `i18n/` subdirectory |
| Feature flags typed and co-located | ✅ | Defined as typed constants |
| SLA values referenced from `SK_STALENESS_CONTRACT` | ✅ | `[S4]` — no hardcoded numeric SLAs in this layer |
