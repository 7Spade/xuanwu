# shared/constants

Stateless, infrastructure-free constant definitions shared across the entire app.

## Rules

- No Firebase / React imports — pure TypeScript only.
- No async code or side effects.
- Use `as const` and mapped meta objects; avoid the `enum` keyword (see `../enums/README.md`).
- Slugs and status strings that are stored in Firestore must **never be renamed** once shipped.

## Files

| File | Purpose |
|---|---|
| `location-units.ts` | 棟/樓/區/室/號/廠/倉/期/座/基地/柱 — spatial position designators for tech parks & construction sites |
| `roles.ts` | OrganizationRole & WorkspaceRole metadata (labels, ranks, display info) |
| `routes.ts` | Application route path constants |
| `settings.ts` | App-wide configuration defaults (pagination, file upload limits, XP bounds, feature flags) |
| `skills.ts` | Global skill taxonomy: 6 大項目 × 17 子項目 × 40 individual skill definitions |
| `status.ts` | Domain status / lifecycle state metadata (ScheduleStatus, WorkspaceLifecycleState, AuditLogType, InviteState, Presence, NotificationType) |
| `taiwan-address.ts` | Taiwan county/district registry with zip codes and English names (22 administrative divisions) |

## Adding a new constants file

1. Create `src/shared/constants/<name>.ts`.
2. Export at minimum one `as const` object or array.
3. For O(1) lookups export a `Map` alongside the array (see `location-units.ts` for the pattern).
4. Add an entry to the table above.
