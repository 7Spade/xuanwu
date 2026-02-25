# Shared Kernel (`src/features/shared-kernel/`)

## Role

Explicitly agreed cross-BC domain contracts. Every type, interface, or function
that lands here must be:

1. **Used by two or more distinct Bounded Contexts** (Workspace BC, Account BC,
   Organization BC, or Projection Layer).
2. **Pure** — zero dependencies on Firebase, React, or any I/O layer.
3. **Versioned via marker interfaces** where the contract is a structural guarantee
   (see `ImplementsEventEnvelopeContract`, `ImplementsAuthoritySnapshotContract`).

Per `logic-overview_v9.md` Invariant #8:
> Shared Kernel 必須顯式標示；未標示的跨 BC 共用一律視為侵入。

## Contents

All files have been migrated to dedicated VS0 slice directories. The `index.ts` here
acts as a convenience barrel that aggregates all VS0 contracts.

| File / VS0 Slice | Contract | Consumers |
|------|----------|-----------|
| `shared.kernel.event-envelope` | `EventEnvelope<T>`, `ImplementsEventEnvelopeContract` — carries `traceId` (end-to-end shared [R8]), `version` [R7], `idempotency-key` [D2] | `workspace-core.event-bus`, `account-organization.event-bus` |
| `shared.kernel.authority-snapshot` | `AuthoritySnapshot`, `ImplementsAuthoritySnapshotContract` | `projection.workspace-scope-guard`, `projection.account-view` |
| `shared.kernel.skill-tier` (`skill-tier.ts`) | `SkillTier`, `TierDefinition`, `TIER_DEFINITIONS`, `resolveSkillTier()`, `getTier()`, `getTierRank()`, `tierSatisfies()` | `account-organization.schedule`, `workspace-business.schedule`, `projection.account-skill-view`, `projection.org-eligible-member-view` |
| `shared.kernel.skill-tier` (`skill-requirement.ts`) | `SkillRequirement` | `workspace-business.schedule`, `workspace-core.event-bus`, `account-organization.schedule` |
| `shared.kernel.skill-tier` (`schedule-proposed-payload.ts`) | `WorkspaceScheduleProposedPayload`, `ImplementsScheduleProposedPayloadContract` | `workspace-core.event-bus` (produces), `account-organization.schedule` (consumes) |
| `shared.kernel.contract-interfaces` | `CommandResult`, `CommandSuccess { aggregateId, version }`, `CommandFailure { DomainError }` [R4] | `workspace-application` (Command Handler return), all Server Actions |
| `index.ts` | Convenience barrel — re-exports all VS0 slices above | All consumers |

## Import

```ts
// Preferred: single barrel entry point (aggregates all VS0 contracts)
import type { SkillTier, SkillRequirement } from '@/features/shared-kernel';
import { resolveSkillTier, tierSatisfies } from '@/features/shared-kernel';

// Direct VS0 slice imports (canonical)
import type { EventEnvelope } from '@/features/shared.kernel.event-envelope';
import type { AuthoritySnapshot } from '@/features/shared.kernel.authority-snapshot';
import type { SkillTier, SkillRequirement, WorkspaceScheduleProposedPayload } from '@/features/shared.kernel.skill-tier';
import type { CommandResult } from '@/features/shared.kernel.contract-interfaces';
```

## Rules

- **No imports from `features/`** — this barrel imports from VS0 sibling slices only.
- **No imports from `shared/`** — ever. The shared-kernel sits BELOW shared.
- Adding a new export requires evidence that it is used by two or more BCs and
  carries no infrastructure dependency; create a new `shared.kernel.*` slice.

## Relationship to `shared/types`

`shared/types` re-exports shared-kernel types so that existing `@/shared/types`
import paths continue to work:

```ts
// shared/types/skill.types.ts (excerpt)
export type { SkillTier, TierDefinition } from '@/features/shared.kernel.skill-tier';
export type { SkillRequirement } from '@/features/shared.kernel.skill-tier';
```
