# Xuanwu — AI Assistant Instructions

> This file is automatically embedded into the repomix output by `repomix.config.ts`.
> When reading the packed codebase, follow these guidelines to produce accurate, architecture-compliant code.

---

## 1. Single Source of Truth

| Artefact | Purpose |
|---|---|
| `docs/architecture/00-LogicOverview.md` | Architecture SSOT — layer definitions, dependency rules, invariants |
| `docs/knowledge-graph.json` | Semantic entity relationships |
| `eslint.config.mts` | Enforces D1–D26 rules as ESLint errors |

**Always read `docs/architecture/00-LogicOverview.md` before proposing any structural change.**

---

## 2. Layer Map (L0 – L9)

```
L0  External Triggers      src/app/             Next.js pages, route handlers, middleware
L1  Shared Kernel          src/features/shared-kernel/   Contracts, ports, pure types (VS0)
L2  Command Gateway        src/features/*/core/_actions.ts
L3  Domain Slices          src/features/{slice}/   VS1–VS8 business verticals
L4  IER (Event Router)     src/features/*/core.event-bus/
L5  Projection Bus         src/features/projection.bus/
L6  Query Gateway          src/features/*/core/_queries.ts
L7  Firebase ACL           src/shared/infra/{auth,firestore,messaging,storage}/
L8  Firebase Infra         src/shared-infra/backend-firebase/
L9  Observability          src/app-runtime/ + logging adapters
```

---

## 3. Vertical Slices (VS)

| ID | Slice | Directory |
|---|---|---|
| VS0 | SharedKernel | `src/features/shared-kernel/` |
| VS1 | Identity | `src/features/identity.slice/` |
| VS2 | Account | `src/features/account.slice/` |
| VS3 | Skill XP | `src/features/skill-xp.slice/` |
| VS4 | Organization | `src/features/organization.slice/` |
| VS5 | Workspace | `src/features/workspace.slice/` |
| VS6 | Workforce-Scheduling | `src/features/workforce-scheduling.slice/` |
| VS7 | Notification | `src/features/notification-hub.slice/` |
| VS8 | Semantic Graph | `src/features/semantic-graph.slice/` |

Cross-cutting authorities (not VS-numbered):
- `global-search.slice` — sole cross-domain search gateway [D26 #A12]
- `notification-hub` — sole side-effect outlet [D26 #A13]

---

## 4. Hard Invariants — Never Violate

| Rule | Description |
|---|---|
| **D7** | Cross-slice reference only through `{slice}/index.ts` public API |
| **D21** | New tag categories defined only in VS8 (Semantic Graph) |
| **D24** | Feature slices must NOT `import firebase/*` directly; use SK_PORTS |
| **D26** | Feature slices must NOT build their own search or send push/SMS directly |
| **S2** | All Projection writes must call `applyVersionGuard()` first |
| **S4** | Staleness values must reference `SK_STALENESS_CONTRACT` constants |
| **R8** | `traceId` injected once at CBG_ENTRY, read-only across the full chain |
| **A8** | One command = one aggregate |

---

## 5. Dependency Rule (direction of allowed imports)

```
L0 → L1 → L2 → L3 → L4 → L5 → L6 → L7 → L8
                 ↕ (no upward import, no cross-slice without index.ts)
```

- **Forbidden**: BC_X directly writes BC_Y aggregate (must use IER Domain Event)
- **Forbidden**: TX Runner emits Domain Events (only Aggregates may)
- **Forbidden**: B-track calls back into A-track (use Domain Event only)

---

## 6. Naming Conventions

| Pattern | Meaning |
|---|---|
| `_actions.ts` | Server Actions / Command Gateway entry points |
| `_queries.ts` | Query Gateway (read-only) |
| `_types.ts` | Local type definitions |
| `_contract.ts` | Public interface exported via `index.ts` |
| `_events.ts` | Domain / IER event definitions |
| `_hooks/` | React hooks (client components only) |
| `_components/` | React UI components |
| `index.ts` | Slice public API surface [D7] |

---

## 7. Bootstrap & Validation Commands

```bash
npm install                  # MANDATORY first — sandbox has no node_modules
npm run lint                 # ESLint D1–D26 checks (0 errors expected)
npm run typecheck            # tsc --noEmit (errors in firebase/functions/** are unrelated)
npm run check                # lint + typecheck in one pass
npm run dev                  # Dev server on http://localhost:9002
```

Known baseline after `npm install`:
- `npm run lint` → 0 errors, ~1,390 warnings (D24 tracked debt, not regressions)
- `npm run typecheck` → 67 errors all in `firebase/functions/**` (separate package)

---

## 8. Key Files to Read Before Making Changes

1. `docs/architecture/00-LogicOverview.md` — architecture & invariants SSOT
2. `eslint.config.mts` — enforced rules
3. `src/features/shared-kernel/` — shared contracts & ports
4. Relevant `{slice}/index.ts` — slice public API
5. `docs/development/` — feature-specific guides (e.g. `workspace.slice-guide.md`)
