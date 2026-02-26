# Feature Slice: `projection.org-eligible-member-view`

## Domain

Organization-scoped eligible member read model — the ONLY source that
`organization.schedule` (and `workspace-business.schedule`) may use to check
member availability and skill tiers.

## Responsibilities

- Track `xp` per `(orgId, accountId, skillId)` for all org members.
- Maintain the `eligible` flag for schedule assignment availability.
- Expose queries that compute tier on-the-fly via `resolveSkillTier(xp)`.
- Tier is NEVER stored — always derived at query time.

## Invariants Enforced

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 12 | Tier is never stored in DB | `OrgEligibleMemberEntry.skills` stores only `{ xp }`; tier computed via `enrichWithTier` |
| 14 | Schedule reads only this projection | `getOrgMemberEligibility` / `getOrgEligibleMembersWithTier` are the only valid read paths for schedule |
| 19 | **[SK_VERSION_GUARD S2]** eligible updates must be monotonically increasing in aggregateVersion | `applyOrgMemberSkillXp` discards events where `event.aggregateVersion <= view.lastProcessedVersion` |

## SK_VERSION_GUARD Contract [S2]

v10 泛化 #19 — per `logic-overview.md` [S2]:
```
Update rule:
  event.aggregateVersion > view.lastProcessedVersion → allow update
  otherwise → discard (stale event; do NOT overwrite newer state)

Scope: ALL Projections (v9 limited to eligible-view; v10 S2 extends to every Projection)
Reason: FUNNEL CRITICAL_PROJ_LANE does not guarantee delivery order.
Example: ScheduleCompleted arrives first, ScheduleAssigned arrives late →
  without guard, eligible incorrectly reverts to `false`.
```

This slice was the **origin** of Invariant #19. In v10, the rule is extracted to
`shared.kernel.version-guard [S2]` and applied universally by FUNNEL (D14).

## Write Path (Event Funnel → Projector)

```
organization:member:joined   → initOrgMemberEntry(orgId, accountId)
organization:member:left     → removeOrgMemberEntry(orgId, accountId)
organization:skill:xpAdded   → applyOrgMemberSkillXp(orgId, accountId, skillId, newXp)
organization:skill:xpDeducted → applyOrgMemberSkillXp(orgId, accountId, skillId, newXp)
```

## Internal Files

| File | Purpose |
|------|---------|
| `_projector.ts` | `initOrgMemberEntry`, `removeOrgMemberEntry`, `applyOrgMemberSkillXp`, `OrgEligibleMemberEntry` type |
| `_queries.ts` | `getOrgMemberEligibility`, `getOrgEligibleMembers`, `getOrgMemberEligibilityWithTier`, `getOrgEligibleMembersWithTier` |
| `index.ts` | Public API |

## Firestore Paths

| Path | Data |
|------|------|
| `orgEligibleMemberView/{orgId}/members/{accountId}` | `OrgEligibleMemberEntry` (skills: `{ [skillId]: { xp } }`, eligible, readModelVersion — no tier) |

## Public API (`index.ts`)

```ts
export { initOrgMemberEntry, removeOrgMemberEntry, applyOrgMemberSkillXp } from './_projector';
export {
  getOrgMemberEligibility,
  getOrgEligibleMembers,
  getOrgMemberEligibilityWithTier,
  getOrgEligibleMembersWithTier,
} from './_queries';
export type { OrgEligibleMemberEntry, OrgMemberSkillWithTier, OrgEligibleMemberView } from '...';
```

## Dependencies

- `@/shared/infra/firestore/` — read/write/delete adapters
- `firebase/firestore` — serverTimestamp, getDocs, collection
- `@/shared/lib` — `resolveSkillTier` (pure function, no I/O)
- `@/shared/types` — `SkillTier`

## Architecture Note [S2][R7]

`logic-overview.md` [SK_VERSION_GUARD S2] D11:
`EVENT_FUNNEL_INPUT → ORG_ELIGIBLE_MEMBER_VIEW`
`ORG_ELIGIBLE_MEMBER_VIEW -.→ getTier 計算（不存 DB）`
`W_B_SCHEDULE -.→ ORG_ELIGIBLE_MEMBER_VIEW（查詢可用帳號 · eligible=true · 只讀）`

Invariant #19 泛化 (v10 S2): eligible updates MUST use monotonically increasing
aggregateVersion. Rule extracted to `shared.kernel.version-guard [S2]` and universally
enforced by FUNNEL across all Projections. This slice was the original source of #19.
D14: FUNNEL must reference SK_VERSION_GUARD before writing to any Projection.

`account-organization.schedule/_schedule.ts` imports `getOrgMemberEligibility` from
this slice to validate schedule assignment eligibility (Invariant #14).
