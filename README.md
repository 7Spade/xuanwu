# Repo Layering Rules

* **src/app** → Next.js App Router, routing, layouts, pages. Only composition, no business logic or runtime wiring.
* **src/app-runtime** → Application runtime layer. Holds providers, runtime hooks, AI flows, and dependency wiring. Initializes SDKs and injects context. No domain logic.
* **src/config** → Static configuration: environment variables, feature flags, i18n, themes. Pure data, no runtime side effects.
* **src/features** → Business domain slices, rules, feature-specific logic. Depends on shared contracts and app-runtime, never on infra directly.
* **src/shared** → Contracts, interfaces, constants, pure utilities, shared types. No runtime side effects or business logic.
* **src/shared-infra** → External system adapters: Firebase, APIs, storage, messaging. Implements shared contracts. Features and app-runtime may depend on this, never the other way around.

---

# Dependency Direction

```
app
 ↓
app-runtime
 ↓
features
 ↓
shared
 ↓
shared-infra
```

* Flow is strictly downward.
* app-runtime may import shared or shared-infra, but never features.
* Features may import shared and shared-infra, but never app or app-runtime providers.
* Shared and shared-infra are leaf layers; they do not import anything higher.

---

# Layer Principles

1. **Separation of Concerns**: runtime, business, infrastructure, and config are strictly separated.
2. **No Runtime in Shared**: shared holds pure contracts, constants, types, and utils only.
3. **No Business Logic in Runtime**: app-runtime wires systems, initializes SDKs, and injects providers/hooks only.
4. **Infra Isolation**: shared-infra implements adapters but never contains domain logic.
5. **Feature Independence**: each feature depends only on shared contracts or infra, never on other features.

---

# One-Line Summary

Each folder has a single responsibility: app = UI, app-runtime = runtime wiring, config = static config, features = business logic, shared = contracts/utils, shared-infra = external adapters.

repomix --skill-generate xuanwu-skill --skill-output ./skills --force
npx repomix --config repomix.config.ts