# VS4 · Organization Slice

## Domain Responsibility

The Organization slice owns **organisation core data, member governance, partner management,
team structures, and org-level policies**. It is the authoritative context for multi-tenant
access control and is referenced heavily by VS5 (Workspace) and VS6 (Scheduling).

## Main Entities

| Entity | Description |
|--------|-------------|
| `organization` aggregate | Org name, settings, billing plan. |
| `gov.members` | Member roster; records join/leave/role assignments. |
| `gov.partners` | External partner organisations linked to this org. |
| `gov.teams` | Team groups within an org; used for assignment routing. |
| `gov.policy` | Org-level policy (access rules, feature flags per org). |

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| VS1 Identity | `active-account-context` to verify requester org membership |
| VS2 Account | Account profiles for member resolution |
| VS8 Semantic Graph | `tag::team` (TE5), `tag::role` (TE4), `tag::partner` (TE6) entities |
| Shared Kernel [VS0] | `authority-snapshot`, `skill-requirement` contract |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| IER | `OrgContextProvisioned`, `OrgPolicyChanged`, `MemberJoined/Left` events |
| Projection Bus [L5] | `organization-view`, `org-eligible-member-view` read models |
| VS6 Scheduling | Eligibility data for assignment routing |
| VS8 Semantic Graph | Team and role tag registrations |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `OrgContextProvisioned` | SAFE_AUTO | Org context ready after login/switch. |
| `OrgPolicyChanged` | REVIEW_REQUIRED | Policy update; may trigger claims refresh. |
| `MemberJoined` / `MemberLeft` | REVIEW_REQUIRED | Membership roster change. |
| `TeamCreated` / `TeamUpdated` | SAFE_AUTO | Team structure change. |
| `PartnerLinked` / `PartnerUnlinked` | REVIEW_REQUIRED | Partner relationship change. |

## Key Invariants

- **[A9]** `scope-guard`: workspace-level operations must validate org membership before execution.
- **[D24]** No direct `firebase/*` imports.
- **[D7]** VS5/VS6 reference org data through `organization.slice/index.ts` public API only.
- **[E2]** `OrgContextProvisioned` fires after org membership is confirmed; downstream slices wait for this before acting.
