# src/shared-infra — Infrastructure Layer

## Architecture Role

`src/shared-infra` is the **external infrastructure layer** — it owns the raw Firebase project configuration, Cloud Functions, Firestore security rules, and Storage rules that constitute the deployed backend. This layer sits at the boundary between the application codebase and the cloud platform.

```
src/shared/infra     (ACL Adapters — implements SK_PORTS)
  └──> src/shared-infra  ← THIS LAYER
         ├── backend-firebase/   (Cloud Functions, project config)
         ├── frontend-firebase/  (Firestore/Storage rules, indexes)
         └── ...                 (future: other cloud infra)
              └──> Firebase Cloud Platform (L8)
```

**Separation of concerns:** The ACL adapters in `src/shared/infra` are the *application-side* abstraction (they implement port interfaces). `src/shared-infra` is the *platform-side* implementation (actual Firebase project wiring, Cloud Functions runtime, security rules).

---

## Directory Structure

```
src/shared-infra/
├── README.md
├── backend-firebase/               # Server-side Firebase (Cloud Functions + project config)
│   ├── firebase.json               # Firebase project configuration (deploy targets)
│   ├── .firebaserc                 # Firebase project reference
│   └── functions/                  # Firebase Cloud Functions (server-side)
│       ├── package.json            # Separate Node.js package (independent TS compile)
│       ├── tsconfig.json           # Separate TypeScript config (excluded from root tsconfig)
│       └── src/
│           └── ...                 # Cloud Function handlers
│
└── frontend-firebase/              # Client-side Firebase (security rules, indexes)
    ├── firestore/                  # Firestore configuration
    │   ├── firestore.rules         # Security rules (deployed via Firebase CLI)
    │   └── firestore.indexes.json  # Composite index definitions
    │
    └── storage/                    # Cloud Storage
        └── storage.rules           # Storage security rules
```

---

## Firebase Cloud Functions

Cloud Functions live in `backend-firebase/functions/` and are compiled as a **separate TypeScript package** from the Next.js app:

| Aspect | Detail |
|--------|--------|
| Package | `backend-firebase/functions/package.json` — independent `node_modules` |
| TypeScript | `backend-firebase/functions/tsconfig.json` — separate compilation |
| Root tsconfig exclusion | `tsconfig.json` excludes `src/shared-infra/backend-firebase/functions/**` |
| Lint | Not checked by root `npm run lint` / `npm run typecheck` |
| Deploy | `firebase deploy --only functions` |

> **[typecheck scope]:** `npm run typecheck` at the project root checks **only** the Next.js application code. The 67 TypeScript errors visible in `src/shared-infra/backend-firebase/functions/` are a separate concern and require `npm install --prefix backend-firebase/functions` to resolve in isolation.

---

## Security Rules

Firestore and Storage security rules are the authoritative access control for the Firebase backend. They are maintained in `frontend-firebase/`:

| File | Scope |
|------|-------|
| `frontend-firebase/firestore/firestore.rules` | All Firestore read/write access |
| `frontend-firebase/storage/storage.rules` | Cloud Storage bucket access |

Rules are deployed via `firebase deploy --only firestore:rules,storage:rules`.

**Design principle:** Security rules enforce data ownership and membership invariants that mirror the domain rules defined in `docs/logic-overview.md` — they are not the source of truth, but they must stay in sync with it.

---

## Dependency Rules

| Direction | Rule |
|-----------|------|
| ✅ Allowed | `src/shared/infra` (ACL adapters) → `src/shared-infra` (SDK init) |
| ✅ Allowed | `src/shared-infra/backend-firebase/functions` → `firebase-admin` (server SDK) |
| ❌ Forbidden | `src/shared-infra` importing from `src/features`, `src/app`, `src/app-runtime` |
| ❌ Forbidden | Feature slices importing from `src/shared-infra` directly [D24] |
| ❌ Forbidden | Feature slices importing from `firebase/*` (must use SK_PORTS) [D24] |

---

## Integration with the ACL Adapter Layer

The ACL adapters in `src/shared/infra/` depend on `src/shared-infra` for the initialized Firebase SDK instances. The dependency flows **one way**:

```
src/shared/infra/firestore/firestore.facade.ts
  └──> imports Firebase Firestore instance
         └──> src/shared-infra/backend-firebase/  (or functions SDK)
```

Feature slices **never** touch `src/shared-infra` — they call the port interface, which the adapter resolves at runtime.

---

## Compliance Check

| Rule | Status | Notes |
|------|--------|-------|
| Functions package independently compiled | ✅ | Excluded from root `tsconfig.json` |
| Firebase config reads from env vars | ✅ | No hardcoded credentials |
| Feature slices cannot import from this layer | ✅ | `[D24]` ESLint rule enforced |
| Firestore security rules deployed separately | ✅ | `firebase deploy --only firestore:rules` |
| Functions type errors isolated from app typechecks | ✅ | Root `tsconfig.json` excludes `backend-firebase/functions/**` |
