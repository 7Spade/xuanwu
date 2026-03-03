# shared/enums

Runtime-iterable representations of the string-union types defined in `src/shared/types/`.

## Why not TypeScript `enum`?

This project deliberately avoids the `enum` keyword. Reasons:

- Regular `enum` values compile to an IIFE object and don't tree-shake cleanly in all bundlers.
- `const enum` is inlined at compile time, which breaks across module boundaries in Next.js (transpile-only pipeline).
- String union types (`'active' | 'away' | 'offline'`) are more readable, type-safe, and JSON-compatible.

## Convention

```ts
// ✅ Preferred pattern — union type + const array
//    type lives in src/shared/types/
//    array lives here in src/shared/enums/ (or in src/shared/constants/ when metadata is rich)

// src/shared/types/account.types.ts
export type Presence = 'active' | 'away' | 'offline';

// src/shared/enums/presence.ts
import type { Presence } from '@/shared/types/account.types';
export const PRESENCES: readonly Presence[] = ['active', 'away', 'offline'] as const;
```

## When to put metadata-rich descriptors in `constants/` instead

If a value needs a display label, colour, rank, or other metadata, place the descriptor array
in `src/shared/constants/` (e.g. `roles.ts`, `status.ts`) and only keep the plain ordered array
here for iteration / validation use-cases.

## Files

| File | Covered union types |
|---|---|
| _(add files as needed)_ | |
