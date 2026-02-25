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

| File | Contract | Consumers |
|------|----------|-----------|
| *(see `shared.kernel.event-envelope`)* | `EventEnvelope<T>`, `ImplementsEventEnvelopeContract` — carries `traceId` (end-to-end shared [R8]), `version` [R7], `idempotency-key` [D2] | `workspace-core.event-bus`, `account-organization.event-bus` |
| `identity/authority-snapshot.ts` | `AuthoritySnapshot`, `ImplementsAuthoritySnapshotContract` | `projection.workspace-scope-guard`, `projection.account-view` |
| `skills/skill-tier.ts` | `SkillTier`, `TierDefinition`, `TIER_DEFINITIONS`, `resolveSkillTier()`, `getTier()`, `getTierRank()`, `tierSatisfies()` | `account-user.skill`, `account-organization.schedule`, `workspace-business.schedule`, `projection.account-skill-view`, `projection.org-eligible-member-view` |
| `workforce/skill-requirement.ts` | `SkillRequirement` | `workspace-business.schedule`, `workspace-business.document-parser`, `workspace-core.event-bus`, `account-organization.schedule` |
| `workforce/schedule-proposed-payload.ts` | `WorkspaceScheduleProposedPayload`, `ImplementsScheduleProposedPayloadContract` | `workspace-core.event-bus` (produces), `account-organization.schedule` (consumes) |
| *(see `shared.kernel.contract-interfaces`)* | `CommandResult`, `CommandSuccess { aggregateId, version }`, `CommandFailure { DomainError }` [R4] | `workspace-application` (Command Handler return), all Server Actions |
| `index.ts` | Convenience barrel — re-exports all of the above from individual VS0 slices | All consumers |

## Import

```ts
// Preferred: single barrel entry point (aggregates all VS0 contracts)
import type { SkillTier, SkillRequirement } from '@/features/shared-kernel';
import { resolveSkillTier, tierSatisfies } from '@/features/shared-kernel';

// Direct VS0 slice imports (preferred for EventEnvelope and CommandResult)
import type { EventEnvelope } from '@/features/shared.kernel.event-envelope';
import type { CommandResult } from '@/features/shared.kernel.contract-interfaces';

// Granular imports by domain subdirectory (within shared-kernel only)
import type { AuthoritySnapshot } from '@/features/shared-kernel/identity/authority-snapshot';
import type { SkillTier } from '@/features/shared-kernel/skills/skill-tier';
import type { SkillRequirement } from '@/features/shared-kernel/workforce/skill-requirement';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel/workforce/schedule-proposed-payload';
```

## Rules

- **No imports from `features/`** — ever.
- **No imports from `shared/`** — ever. The shared-kernel sits BELOW shared.
- Only intra-shared-kernel imports are allowed (e.g. `skill-requirement` imports
  `SkillTier` from `./skill-tier`).
- Adding a new export requires evidence that it is used by two or more BCs and
  carries no infrastructure dependency.

## Relationship to `shared/types`

`shared/types` re-exports shared-kernel types so that existing `@/shared/types`
import paths continue to work:

```ts
// shared/types/skill.types.ts (excerpt)
export type { SkillTier, TierDefinition } from '@/features/shared-kernel/skills/skill-tier';
export type { SkillRequirement } from '@/features/shared-kernel/workforce/skill-requirement';
```
