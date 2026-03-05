# VS5 · Workspace Slice

## Domain Responsibility

The Workspace slice is the **core product domain** — it manages projects (workspaces),
tasks, document parsing, billing documents, and business workflows.
It relies on VS8 for cost semantic classification and delegates search to global-search.slice.

## Main Entities

| Entity | Description |
|--------|-------------|
| `workspace` aggregate | Project container; owned by an org. |
| `business.tasks` | Task list within a workspace; driven by parsed documents. |
| `business.document-parser` | Parses uploaded construction/billing documents into `ParsedLineItem[]`. |
| `business.parsing-intent` | Records intent to parse; carries idempotency key (`sourceFileId` or hash). |
| `business.files` | File storage metadata linked to a workspace. |
| `business.workflow` | Multi-step approval/review workflows. |
| `gov.audit` | Audit log of workspace mutations. |

## Document Parsing + Cost Classification Flow

```
Upload file
  → saveParsingIntent (D14/D15 idempotency guards)
    → document-parser produces ParsedLineItem[]
      → classifyCostItem(name) → CostItemType  [VS8 D27 #A14]
        → Layer-3 Semantic Router
          EXECUTABLE  → materialize as task
          others      → silent skip + toast
```

**[#A14]** `ParsedLineItem.costItemType` is set by VS8 `_cost-classifier.ts`.
The Layer-3 router must only materialize `EXECUTABLE` items as tasks.

## Idempotency Guards [D14/D15]

`saveParsingIntent` has two guards:
1. `sourceFileId`-based: query `getParsingIntentBySourceFileId` before creating.
2. Hash-based: when `sourceFileId` is absent, check `previousIntentId` → hash match → no-op.

`importItems()` uses a synchronous `useRef<Set<string>>` in-memory lock (`inProgressImports`)
to prevent TOCTOU duplicate task creation.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| VS4 Organization | Org membership / scope guard [A9] |
| VS8 Semantic Graph | `classifyCostItem()` for cost classification [D27]; tag-snapshot for routing |
| Shared Kernel [VS0] | All infra contracts; `command-result-contract` |
| IER | Workspace events from other slices (e.g., `ScheduleAssigned`) |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| IER | All workspace domain events |
| global-search.slice | Workspace content indexed for search [D26 #A12] |
| notification-hub | Workflow state changes trigger notifications [D26 #A13] |
| Projection Bus [L5] | `workspace-view`, `workspace-scope-guard` read models |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `WorkspaceCreated` | SAFE_AUTO | New workspace provisioned. |
| `TaskCreated` / `TaskUpdated` | SAFE_AUTO | Task lifecycle. |
| `DocumentParsed` | SAFE_AUTO | Parsing result available. |
| `WorkflowStateChanged` | REVIEW_REQUIRED | Multi-step workflow transitions. |
| `BillingDocumentProcessed` | REVIEW_REQUIRED | Financial document finalized. |

## Key Invariants

- **[D27]** VS5 must call `VS8 classifyCostItem()` and must NOT re-implement cost logic.
- **[D26]** Must use `global-search.slice` for all search; must not build private search logic.
- **[D26 #A13]** Must use `notification-hub` for all notifications.
- **[D14]** Idempotency is the responsibility of `saveParsingIntent` and `importItems()`.
- **[A9]** `workspace-scope-guard` blocks access if requester is not an org member.
