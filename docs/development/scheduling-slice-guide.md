# Scheduling Slice — Design Guide

> **Status**: Authoritative reference  
> **Scope**: `src/features/scheduling.slice`  
> **Last updated**: 2026-03

---

## 1. Purpose

The `scheduling.slice` is the **VS6 cross-org staffing aggregate**. It owns the lifecycle of every
`ScheduleItem` from workspace proposal through org approval, assignment, completion, or cancellation.

**Single source of truth**: `accounts/{orgId}/schedule_items/{scheduleItemId}`  
All three schedule UI tabs (Calendar, Demand Board, HR Governance) read from this collection — no
separate projection collection is required.

---

## 2. Architecture Constraints (D-Rules)

| Rule | Constraint |
|------|-----------|
| **D3** | All Firestore writes go through `WriteOp` objects returned by the aggregate. Never write directly from a component. |
| **D5** | Components must not import `@/shared/infra/firestore/*` directly. Use `_actions.ts` (Server Actions). |
| **D6** | `'use client'` is only allowed in `_components/` or `_hooks/` leaf nodes. Layouts/pages stay Server Components. |
| **D19** | `ScheduleItem` and `ScheduleStatus` must be imported from `@/features/shared-kernel`. |
| **R4** | Every exported function in `_actions.ts` must return `Promise<CommandResult>`. |
| **R8** | `traceId` is threaded from `CBG_ENTRY` — never regenerated inside actions. |

---

## 3. Module Layout

```
scheduling.slice/
├── _aggregate.ts        # DDD aggregate — state machine + WriteOp factories
├── _actions.ts          # 'use server' — all mutations (returns CommandResult)
├── _write-op.ts         # Shared WriteOp executor (used by _actions + _saga)
├── _selectors.ts        # Pure data-derivation functions (no React deps)
├── _eligibility.ts      # Pure skill-matching helpers (testable without Firestore)
├── _queries.ts          # Firestore read / subscribe helpers
├── _saga.ts             # VS6 cross-org saga coordinator
├── _components/         # React UI components ('use client')
│   └── demand-board.tsx # Sortable demand board with @dnd-kit/sortable
├── _hooks/              # React hooks ('use client')
│   ├── use-global-schedule.ts   # Delegates to _selectors.ts
│   ├── use-org-schedule.ts      # Firestore subscriptions for org schedule
│   └── ...
├── _projectors/         # Account-level read model projectors
└── index.ts             # Public API re-exports
```

---

## 4. Aggregate State Machine

```
draft → proposed → confirmed → completed
                             → assignmentCancelled
                 → cancelled
```

ScheduleStatus mapping:

| Aggregate state | ScheduleStatus |
|----------------|---------------|
| `proposed`     | `PROPOSAL`     |
| `confirmed`    | `OFFICIAL`     |
| `cancelled`    | `REJECTED`     |
| `completed`    | `COMPLETED`    |
| `assignmentCancelled` | `REJECTED` |

---

## 5. WriteOp Pattern [D3]

The aggregate never calls Firestore directly. It returns `WriteOp` objects that callers execute:

```typescript
// _aggregate.ts (aggregate factory — pure)
export function approveOrgScheduleProposal(...): ScheduleApprovalResult {
  return { writeOp: { path: '...', data: {...} }, outcome: 'confirmed', ... };
}

// _write-op.ts (shared executor)
export async function executeWriteOp(op: WriteOp): Promise<void> { ... }

// _actions.ts (server action — orchestrates)
const result = await approveOrgScheduleProposal(...);
await executeWriteOp(result.writeOp);
```

`executeWriteOp` is the **single implementation** shared by `_actions.ts` and `_saga.ts`.
Duplicate inline copies are not permitted.

---

## 6. Selectors Pattern

Pure selector functions live in `_selectors.ts` and derive all view-model data without React
dependencies. Hooks in `_hooks/` import selectors and wrap them in `useMemo`.

```typescript
// _selectors.ts
export function selectAllScheduleItems(
  scheduleItems: Record<string, ScheduleItem>,
  workspaces: Record<string, { name?: string }>
): ScheduleItemWithWorkspace[] { ... }

export function selectPendingProposals(items: ScheduleItemWithWorkspace[]): ScheduleItemWithWorkspace[] { ... }
export function selectDecisionHistory(items: ScheduleItemWithWorkspace[]): ScheduleItemWithWorkspace[] { ... }
export function selectUpcomingEvents<M>(items: ScheduleItemWithWorkspace[], members: M[]): (ScheduleItemWithWorkspace & { members: M[] })[] { ... }
export function selectPresentEvents<M>(items: ScheduleItemWithWorkspace[], members: M[]): (ScheduleItemWithWorkspace & { members: M[] })[] { ... }
```

**Benefits**:
- Testable with Vitest without mounting React components
- Logic is documented in one place; hooks stay thin
- Reusable across hooks that read the same state slice

---

## 7. Demand Board — Drag-to-Prioritize [dnd-kit]

The `DemandBoard` component uses `@dnd-kit/sortable` so HR can drag PROPOSAL items to set their
priority order visually.  This order is **local state only** — no server write is needed.

```tsx
// demand-board.tsx (simplified)
import { DndContext, closestCenter, ... } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function DemandBoard() {
  const [orderedIds, setOrderedIds] = useState<string[]>(() => openItems.map(i => i.id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedIds(ids => arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string)));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        {orderedIds.map(id => <SortableDemandRow key={id} item={...} ... />)}
      </SortableContext>
    </DndContext>
  );
}
```

---

## 8. Timestamp Convention

All ISO timestamp strings MUST use `Timestamp.now().toDate().toISOString()` — never `new Date().toISOString()` — for Firebase server-time consistency.

---

## 9. CommandResult Contract [R4]

Every exported function in `_actions.ts` returns `Promise<CommandResult>`.  
Callers check `result.success`; on failure use `result.error.message` for user-facing toast messages.

```typescript
const result = await manualAssignScheduleMember(...);
if (!result.success) {
  toast({ variant: 'destructive', description: result.error.message });
}
```

---

## 10. Staleness Targets (SK_STALENESS_CONTRACT)

| View | Maximum staleness |
|------|------------------|
| Demand Board | ≤ 5 s |
| Calendar / standard views | ≤ 10 s |
