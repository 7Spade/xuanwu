# global-search.slice · Cross-Domain Search Authority

## Domain Responsibility

`global-search.slice` is the **only cross-domain search authority** [#A12].
Business slices must NOT build their own search logic; they delegate to this slice.
It maintains search indexes built on top of VS8 tag entities and projection views.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| VS8 Semantic Graph | Tag entities (TE1–TE6) for semantic search routing |
| Projection Bus [L5] | Workspace-view, org-view, schedule-view for content indexing |
| All business slices | Search queries from VS4, VS5, VS6 |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| Client consumers | Ranked search results |
| VS8 | Tag-index updates |

## Key Invariants

- **[#A12]** Only `global-search.slice` may build cross-domain search indexes.
- **[D26]** Business slices are forbidden from duplicating search logic.
- Delegates semantic ranking to VS8 `rankAffectedNodes` API.
