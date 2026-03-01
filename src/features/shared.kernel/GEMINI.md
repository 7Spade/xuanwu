# GEMINI.md — Shared Kernel AI Governance

> **Authority**: `docs/logic-overview.md` L1 section.  
> **This document governs all AI agent interactions with `src/features/shared.kernel/`.**

---

## 1. What This Module Is

`src/features/shared.kernel/` is the **VS0 Global Contract Centre**. It holds the minimal set of cross-BC (bounded-context) contracts that all vertical slices reference. These are:

- **Pure TypeScript types and interfaces** (zero runtime side effects)
- **Pure computation functions** (zero I/O — inputs → outputs only)
- **Marker interfaces** (conformance declarations for implementations in other slices)

---

## 2. Non-Negotiable Rules (AI Must Enforce)

### 2.1 Zero Infrastructure Rule

> Every file in any sub-directory of `shared.kernel/` MUST have zero infrastructure imports.

**Forbidden imports in shared.kernel:**
```typescript
// ❌ ALL of the following are forbidden in shared.kernel sub-modules
import { db } from 'firebase/firestore';
import { auth } from 'firebase/auth';
import React from 'react';
import { NextRequest } from 'next/server';
import { useState } from 'react';
```

**Acceptable imports:**
```typescript
// ✅ Only pure TypeScript — no runtime deps
import type { SkillTier } from '@/shared/types/skill.types';  // type-only, acceptable
```

### 2.2 No Cross-BC Writes in Shared Kernel

The contracts here define shapes and behaviours; they do NOT execute writes. Do NOT add functions that call `setDoc`, `updateDoc`, `createTag`, or any mutation operation.

### 2.3 Tag Authority: Contract Types Only

`shared.kernel/tag-authority/` MUST contain only:
- Event payload types (`TagCreatedPayload`, `TagUpdatedPayload`, etc.)
- Read-only reference types (`TagSlugRef`, `ITagReadPort`)
- Tag category constants (`TAG_CATEGORIES`)
- Conformance markers (`ImplementsTagStaleGuard`)

**Never add to `shared.kernel/tag-authority/`:**
```typescript
// ❌ CRUD operations belong in centralized-tag/_aggregate.ts
export { createTag, updateTag, deprecateTag, deleteTag, getTag };
// ❌ Event bus publication belongs in centralized-tag/_bus.ts
export { publishTagEvent, onTagEvent };
```

### 2.4 Invariant #12 — Tier is NEVER Persisted

When working with `skill-tier/`, enforce:

```typescript
// ✅ Correct — derive tier at display/query time
const tier = getTier(user.xp);  // pure function

// ❌ FORBIDDEN — never store tier in DB
await setDocument(`accounts/${id}`, { tier: getTier(xp) }); // VIOLATION #12
```

### 2.5 TraceID [R8] — Never Regenerate

When working with `event-envelope/`, enforce:

```typescript
// ✅ Correct — propagate traceId from the original envelope
const envelope: EventEnvelope = { ...existing, traceId: existing.traceId };

// ❌ FORBIDDEN — never create a new traceId downstream
const envelope = { traceId: crypto.randomUUID() }; // VIOLATION R8 (must come from CBG_ENTRY)
```

### 2.6 SLA Values — Reference Constants, Never Hardcode

```typescript
// ✅ Correct
import { StalenessMs } from '@/features/shared.kernel';
if (ageMs > StalenessMs.TAG_MAX_STALENESS) { ... }

// ❌ FORBIDDEN — S4 violation
if (ageMs > 30000) { ... }  // hardcoded literal
```

---

## 3. When to Add vs. When NOT to Add a Contract Here

### ✅ Add to shared.kernel WHEN:
- Two or more BCs need to coordinate around the same type/function
- The contract has zero infrastructure dependencies
- `docs/logic-overview.md` references or implies the contract

### ❌ Do NOT add to shared.kernel WHEN:
- The type/function is used in only one slice
- The implementation requires I/O, Firebase, React, or any external service
- The contract is an implementation detail (not a BC coordination point)

---

## 4. Permitted Modifications

| Action | Permitted? | Notes |
|---|---|---|
| Add a new sub-directory with a pure contract | ✅ | Update `index.ts`, `README.md`, and `docs/logic-overview.md` |
| Add pure functions to existing sub-modules | ✅ | Must remain I/O-free |
| Add infrastructure imports to any sub-module | ❌ | Violation of Zero Infrastructure Rule |
| Move CRUD ops from `centralized-tag` here | ❌ | Operations belong in `centralized-tag` |
| Persist derived values (e.g. tier from XP) | ❌ | Invariant #12 violation |
| Hardcode SLA values instead of using `StalenessMs.*` | ❌ | S4 violation |
| Re-generate `traceId` in a downstream contract | ❌ | R8 violation |

---

## 5. Flat `shared.kernel.*` Directories (Legacy Shims)

The flat directories (`src/features/shared.kernel.event-envelope/`, etc.) are **thin re-export shims** pointing to the sub-directories in this unified module. They exist for backward compatibility.

**Rule**: New code MUST import from `@/features/shared.kernel` or a specific sub-path.  
The flat dirs will be removed after all consumers are migrated.

---

## 6. Validation Checklist for AI Agents

Before completing any change to `shared.kernel/`:

- [ ] No infrastructure imports in the modified/added file
- [ ] All new exports added to `shared.kernel/index.ts`
- [ ] `README.md` quick reference table updated (if a new sub-module added)
- [ ] `docs/logic-overview.md` reference exists for the contract
- [ ] `folder-tree.md` updated if a new sub-directory is added
- [ ] `tag-authority/` changes contain NO CRUD operations
- [ ] No hardcoded SLA values (use `StalenessMs.*`)
- [ ] `traceId` is propagated, not regenerated
