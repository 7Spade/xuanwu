# VS3 · Skill Slice

## Domain Responsibility

The Skill slice manages **skill experience points (XP), skill tier computation, and tag lifecycle**.
Skill tiers are computed as pure functions (never persisted). VS3 is one of the two primary
drivers of VS8's learning engine — real skill events update semantic weights.

## Main Entities

| Entity | Description |
|--------|-------------|
| `skill` aggregate | Tracks XP earned by a user for a tagged skill. |
| `skill-tier` (SK contract) | Pure function `getTier(xp) → Tier`; defined in VS0, owned semantically by VS3. |
| `tag-lifecycle` | Records when a skill tag transitions through states (Draft → Active → Stale → Deprecated). |

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| Shared Kernel [VS0] | `skill-tier` contract, `skill-requirement` contract |
| VS8 Semantic Graph | `tag::skill` and `tag::skill-tier` tag entities (TE1, TE2) |
| IER | `SkillRequirementChanged` events from VS4/VS6 |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| VS8 Semantic Graph | `SkillXpChanged` events → `learning-engine.ts` [D21-G] |
| IER | `TagLifecycleEvent` (in-process) for affected skill tags |
| Projection Bus [L5] | `skill-xp` read model; `tag-snapshot` updates |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `SkillXpChanged` | SAFE_AUTO | XP earned or adjusted for a skill. |
| `SkillTierAdvanced` | SAFE_AUTO | User crossed a tier boundary. |
| `TagLifecycleEvent` | SAFE_AUTO | Skill tag state transition (T1 — new slices subscribe to extend). |

## Key Invariants

- **[#12]** `skill-tier` is a pure function; it is never stored in the database.
- **[D21-G]** `learning-engine.ts` in VS8 must be driven by real `SkillXpChanged` / `AccountCreated` facts only — no manual or random weight modifications.
- **[T1]** New slices that need skill-tier data subscribe to `TagLifecycleEvent` rather than coupling to VS3 internals.
- **[D24]** No direct `firebase/*` imports; uses `SK_PORTS`.
