# Feature Slice: `account-user.skill`

## Domain

Account Skill Layer — individual XP accumulation and skill proficiency tracking.
This slice holds **growth sovereignty**: only this BC may write XP values.

## Responsibilities

- `addXp` / `deductXp` — the ONLY two write paths for XP (enforces Invariants #11, #12, #13)
- Mandatory XP Ledger write before every aggregate update
- XP clamped strictly to `0–525` (from `SKILL_XP_MAX`)
- Publish `SkillXpAdded` / `SkillXpDeducted` events to Organization Event Bus via `_actions.ts` (not the aggregate)

## Invariants Enforced

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 11 | XP belongs to Account BC only | `addXp`/`deductXp` are the only write paths; Organization only receives events |
| 12 | Tier is never stored in DB | `AccountSkillRecord` has no `tier` field; derive via `getTier(xp)` |
| 13 | Every XP change produces a Ledger entry | `appendXpLedgerEntry()` is called BEFORE every aggregate write |

## Write Path [E1]

```
Server Action (_actions.ts)
  → addXp/deductXp (aggregate: clamp 0~525, appendXpLedgerEntry, setDocument)
  → _actions.ts publishes SkillXpAdded/SkillXpDeducted → ORG_EVENT_BUS
```

Per E1: The aggregate does NOT publish to cross-BC buses directly (Invariant #3).
`_actions.ts` is the application coordinator responsible for cross-BC event routing.

## Internal Files

| File | Purpose |
|------|---------|
| `_actions.ts` | `addSkillXp`, `deductSkillXp` Server Actions + cross-BC event publishing (E1) |
| `_aggregate.ts` | `addXp`, `deductXp`, `getSkillXp` — pure domain operations, no cross-BC imports |
| `_ledger.ts` | `appendXpLedgerEntry`, `XpLedgerEntry` type |
| `index.ts` | Public API |

## Firestore Paths

| Path | Data |
|------|------|
| `accountSkills/{accountId}/skills/{skillId}` | `AccountSkillRecord` (xp, version — no tier) |
| `accountSkills/{accountId}/xpLedger/{auto-id}` | `XpLedgerEntry` (delta, reason, sourceId, timestamp) |

## Public API (`index.ts`)

```ts
export { addSkillXp, deductSkillXp } from './_actions';
export { addXp, deductXp, getSkillXp, SKILL_XP_MAX, SKILL_XP_MIN } from './_aggregate';
export type { AccountSkillRecord, XpLedgerEntry } from '...';
```

## Dependencies

- `_aggregate.ts`: `@/shared/infra/firestore/` only — no cross-BC imports
- `_actions.ts`: `@/features/account-organization.event-bus` — publishes skill XP events (application coordinator role)
- `@/shared/lib` — `resolveSkillTier` / `getTier` (read-only derivation)

## Architecture Note (E1)

Per `logic-overview_v9.md` E1: `SkillXpAdded/Deducted` events are published by `_actions.ts`
(the application coordinator) to `ORGANIZATION_EVENT_BUS` — NOT by the aggregate directly.
This prevents VS3 → VS4 boundary invasion (Invariant #2 and #3).
Organization may NOT write to this slice; it only receives events and sets `minXpRequired` gates in `ORG_SKILL_RECOGNITION`.
