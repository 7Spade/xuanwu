# VS0 Shared Kernel (`shared.kernel/`)

> **Single source of truth**: `docs/logic-overview.md` — L1 · Shared Kernel section.  
> **Canonical import path**: `@/features/shared.kernel`  
> **Dependency rule**: zero infrastructure imports in any sub-module (no Firebase, no React, no I/O).

---

## Overview

The Shared Kernel is the **global contract centre** for all bounded contexts (BCs) in this system. It contains the minimal set of cross-BC types, pure functions, and interface contracts that every vertical slice may reference.

Two rules govern membership in the Shared Kernel:

1. **Explicitly agreed** — A contract is added here only when multiple BCs must coordinate around it. Invariant #8 requires updating `docs/logic-overview.md` and this index simultaneously.
2. **Zero infrastructure** — Sub-modules must not import from Firebase, React, or any I/O library. Pure TypeScript types and pure functions only.

---

## Directory Structure

```text
shared.kernel/
├─ index.ts                     ← unified public API (import from here)
├─ README.md                    ← this file
├─ GEMINI.md                    ← AI governance rules
│
├─ 📄 Foundational Data Contracts
│  ├─ event-envelope/           SK_ENV [R8][R7]
│  ├─ authority-snapshot/       SK_AUTH_SNAP
│  ├─ skill-tier/               SK_SKILL_TIER + SK_SKILL_REQ [#12][A5]
│  ├─ command-result-contract/  SK_CMD_RESULT [R4]
│  └─ constants/                WorkflowStatus + ErrorCodes [R6]
│
├─ ⚙️ Infrastructure Behaviour Contracts
│  ├─ outbox-contract/          SK_OUTBOX [S1]
│  ├─ version-guard/            SK_VERSION_GUARD [S2]
│  ├─ read-consistency/         SK_READ_CONSISTENCY [S3]
│  ├─ staleness-contract/       SK_STALENESS [S4]
│  ├─ resilience-contract/      SK_RESILIENCE [S5]
│  └─ token-refresh-contract/   SK_TOKEN_REFRESH [S6]
│
├─ 🏷️ Tag Authority Center
│  └─ tag-authority/            [#A6][#17][D21] contract types ONLY (no CRUD ops)
│
└─ 🔌 Infrastructure Ports
   └─ infrastructure-ports/     SK_PORTS [D24]
```

---

## Sub-module Quick Reference

### 📄 Foundational Data Contracts

| Sub-module | Symbol | Purpose |
|---|---|---|
| `event-envelope` | `SK_ENV` | Universal domain event envelope. All bus events must satisfy `EventEnvelope<T>`. TraceID injected once at CBG_ENTRY; never overwritten downstream. [R8][R7] |
| `authority-snapshot` | `SK_AUTH_SNAP` | Point-in-time permission snapshot. TTL = Firebase Token validity. Implemented by projection.workspace-scope-guard and projection.account-view. |
| `skill-tier` | `SK_SKILL_TIER` | Canonical seven-tier proficiency scale. `getTier(xp)` is the only legitimate way to derive a tier from XP. Tier is NEVER persisted. [#12] |
| `skill-tier` | `SK_SKILL_REQ` | Cross-BC staffing requirement (`tagSlug × minXp`). Flows via `WorkspaceScheduleProposedPayload` from Workspace BC → Organization BC. [A5] |
| `command-result-contract` | `SK_CMD_RESULT` | Union of `CommandSuccess` / `CommandFailure` returned by every `_actions.ts`. Never return `void` or raw `Error`. [R4] |
| `constants` | — | `WorkflowStatus` (legal transition set) + `ErrorCodes` (canonical error keys). [R6][R4] |

### ⚙️ Infrastructure Behaviour Contracts

| Sub-module | Symbol | Purpose |
|---|---|---|
| `outbox-contract` | `SK_OUTBOX [S1]` | At-least-once delivery contract. Every OUTBOX record must have `outboxId`, `idempotencyKey`, and `dlqTier`. |
| `version-guard` | `SK_VERSION_GUARD [S2]` | `applyVersionGuard(input)` — discard stale events; allow strictly newer versions. Apply before every Projection write. |
| `read-consistency` | `SK_READ_CONSISTENCY [S3]` | `resolveReadConsistency(ctx)` — routes financial/security/irreversible ops to STRONG_READ; display ops to EVENTUAL_READ. |
| `staleness-contract` | `SK_STALENESS [S4]` | `StalenessMs.*` constants — the single source of truth for all staleness SLA values. Never hardcode `30000`, `500`, `10000`. |
| `resilience-contract` | `SK_RESILIENCE [S5]` | Rate-limit [R1], circuit-breaker [R2], bulkhead [R3] config shapes. Declared per entry-point; implementation in infra.external-triggers. |
| `token-refresh-contract` | `SK_TOKEN_REFRESH [S6]` | Three-way handshake: VS1 (emitter) × IER (router) × frontend (consumer). `TOKEN_REFRESH_SIGNAL` is the canonical signal; `CLIENT_TOKEN_REFRESH_OBLIGATION` is the client contract. |

### 🏷️ Tag Authority Center

| Sub-module | Rule | Purpose |
|---|---|---|
| `tag-authority` | T1–T5 | Contract types ONLY (event payloads, read-only reference, `ITagReadPort`). The CRUD operations live in `src/features/centralized-tag/`. All slices subscribe to `TagLifecycleEvent` to react to changes. |

**Tag Read-Only Rules (T1–T5)**:
- **T1** — New slices subscribe to `TagLifecycleEvent`; MUST NOT maintain their own tag master data.
- **T2** — Store only `tagSlug`; never label or category.
- **T3** — Listen to `TagDeprecated` / `TagDeleted` events to invalidate local refs.
- **T4** — Only allowed local materialization: `SKILL_TAG_POOL` subject to `TAG_MAX_STALENESS` [S4].
- **T5** — Queries needing labels join at read time via `TAG_SNAPSHOT` (EVENTUAL_READ).

### 🔌 Infrastructure Ports

| Sub-module | Ports | Primary Consumer |
|---|---|---|
| `infrastructure-ports` | `IAuthService`, `IFirestoreRepo`, `IMessaging`, `IFileStore` | VS1, VS8, VS7, VS5 respectively |

Feature slices import these interfaces via `@/features/shared.kernel`; concrete adapters live in `src/shared/infra/`.

---

## Import Convention

```typescript
// ✅ Correct — single canonical import path
import type { CommandResult, DomainError } from '@/features/shared.kernel';
import { applyVersionGuard, buildIdempotencyKey } from '@/features/shared.kernel';

// ✅ Also correct — import from specific sub-module if you only need one contract
import type { EventEnvelope } from '@/features/shared.kernel/event-envelope';

// ❌ Forbidden — do not import from flat shared.kernel.* directories directly
import { applyVersionGuard } from '@/features/shared.kernel.version-guard';
```

---

## What Does NOT Belong Here

- Infrastructure adapter implementations (those live in `src/shared/infra/`)
- Feature-domain aggregates or application logic
- Slice-internal event types (those belong in the respective slice)
- `centralized-tag` CRUD operations (`createTag`, `updateTag`, etc.)
- UI components or React hooks

---

## Adding a New Contract

1. Confirm the need with `docs/logic-overview.md` — is this truly cross-BC?
2. Create a new sub-directory under `shared.kernel/` with an `index.ts`.
3. Add the export to `shared.kernel/index.ts`.
4. Update `folder-tree.md` to include the new sub-directory.
5. Update `docs/logic-overview.md` with the new contract reference.
