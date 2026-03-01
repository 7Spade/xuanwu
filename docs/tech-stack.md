# Tech Stack

> Source of truth: `docs/logic-overview.md`
> For governance rules D1–D23 see [logic-overview.md](./logic-overview.md). For project structure and slice boundaries see [project-structure.md](./project-structure.md).

## Runtime & Framework

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | `^15.5.12` | Turbopack dev server (`next dev --turbopack`) |
| Language | TypeScript | `^5.7.3` | Strict mode enabled |
| Runtime | Node.js | `20` | LTS, required by Firebase Functions |
| React | React + React DOM | `^19.2.1` | Server Components first |

## Backend & Data

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Database | Firebase Firestore | `firebase ^11.9.1` | Primary persistence; CDC via `onSnapshot` |
| Auth | Firebase Authentication | `firebase ^11.9.1` | Custom Claims (`E6`), Token Refresh Handshake (`R2`) |
| Functions | Firebase Functions | workspace `functions/` | Outbox Relay Worker (`R1`), DLQ Manager (`R5`) |
| AI Runtime | Genkit | `genkit ^1.20.0` | `@genkit-ai/google-genai ^1.20.0`, `@genkit-ai/next ^1.20.0` |
| AI Provider | Google Gemini | via Genkit | Used in `workspace-business.document-parser` |

## UI & Styling

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Styling | Tailwind CSS | `^3.4.17` | Utility-first; `tailwind-merge`, `tailwindcss-animate` |
| Component library | shadcn/ui (Radix UI) | `@radix-ui/*` | 20+ headless primitives; all managed via shadcn CLI |
| Icons | Lucide React | `^0.475.0` | Consistent icon set |
| Charts | Recharts | `^2.15.4` | Used in analytics/dashboard views |
| Data table | TanStack React Table | `^8.21.3` | Workspace list, audit tables |
| Theming | next-themes | `^0.4.6` | Dark/light mode |
| Carousel | Embla Carousel | `^8.6.0` | Onboarding, media gallery |
| Date picker | React Day Picker | `^9.13.2` | Scheduling UIs |
| Drawer | Vaul | `^1.1.2` | Mobile-friendly sheet panels |
| Toast | Sonner | `^2.0.7` | Notification toasts |
| OTP input | input-otp | `^1.4.2` | Auth verification screens |

## Forms & Validation

| Technology | Version | Notes |
|-----------|---------|-------|
| React Hook Form | `^7.71.2` | Form state management |
| `@hookform/resolvers` | `^4.1.3` | Zod resolver bridge |
| Zod | `^3.25.76` | Schema validation for Server Actions & API boundaries |

## State Management

| Technology | Version | Notes |
|-----------|---------|-------|
| Zustand | `^5.0.3` | Client-side slice state (auth context, active workspace) |
| React Server Components | built-in | Primary read path; minimises client bundle |

## Dev Tooling

| Tool | Version | Notes |
|------|---------|-------|
| ESLint | `^9.17.0` | Flat config (`eslint.config.mts`), `typescript-eslint ^8.18.0` |
| Prettier | `^3.4.2` | Formatting |
| Genkit CLI | `^1.20.0` | `genkit:dev` / `genkit:watch` scripts |
| patch-package | `^8.0.0` | Local dependency patches |
| jiti | `^2.6.1` | ESM/CJS interop for config files |

## Architecture Constraints

- **Server Components first**: `"use client"` only at leaf interaction nodes.
- **No direct Firestore access from components**: all reads go through feature slice `_queries.ts`; all writes through `_actions.ts` (Server Actions).
- **AI flows**: Genkit flows run server-side; exposed via `@genkit-ai/next` route handlers.
- **Event delivery**: `Aggregate → EventBus (in-process) → OUTBOX → OUTBOX_RELAY → IER` — no direct bus-to-IER shortcuts (`D1`).

---

## VS1–VS9 Slice Boundaries Reference

| Slice | Bounded Context | Key Tech Constraint |
|-------|----------------|---------------------|
| VS0 | Shared Kernel + Tag Authority | Pure functions only; no I/O in `shared.kernel.*` (D8) |
| VS1 | Identity / 身份驗證 | Firebase Auth; Custom Claims TTL = Token validity |
| VS2 | Account / 帳號主體 | `WALLET_AGG` requires `STRONG_READ` [S3]; `RoleChanged` → SECURITY_BLOCK DLQ |
| VS3 | Skill XP / 能力成長 | `getTier(xp)` from `shared.kernel.skill-tier`; tier NEVER in DB (#12) |
| VS4 | Organization / 組織治理 | `VS4_TAG_SUBSCRIBER` subscribes IER BACKGROUND_LANE (T2); [S4] staleness via constants |
| VS5 | Workspace / 工作區業務 | Dual-track A/B; B→A ONE-WAY via `IssueResolved` (#A3); Genkit document parser |
| VS6 | Scheduling / 排班協作 | Reads `orgEligibleMemberView` only (#14); scheduling saga compensates [A5] |
| VS7 | Notification / 通知交付 | Stateless FCM router (#A10); FCM push MUST carry `traceId` [R8] |
| VS8 | Projection Bus / 事件投影總線 | FUNNEL is sole projection write path (#9, #A7); SK_VERSION_GUARD on all lanes [S2] |
| VS9 | Observability / 橫切面 | TraceID chain [R8]; `relay_lag` metric from OUTBOX_RELAY [R1] |

---

## D1–D23 Development Rules Reference

| Rule | Summary | Contract |
|------|---------|---------|
| D1 | Event delivery path: Aggregate → EventBus → OUTBOX → RELAY → IER; no shortcuts | — |
| D2 | Public API via `index.ts` only; `_` files private | — |
| D3 | `_actions.ts` sole Server Action entry point | — |
| D4 | `_queries.ts` sole read entry point | — |
| D5 | No direct Firestore access from UI components | — |
| D6 | `"use client"` at leaf nodes only | — |
| D7 | Cross-slice imports via `{slice}/index.ts` only | — |
| D8 | `shared.kernel.*` = contracts + pure functions; no I/O | — |
| D9 | Aggregate mutations via TX Runner (1cmd/1agg #A8) | — |
| D10 | `EventEnvelope.traceId` immutable after CBG_ENTRY | — |
| D11 | Projections must be rebuildable from event stream | — |
| D12 | `SkillTier` computed; never persisted (#12) | — |
| D13 | New Outbox: declare DLQ tier in SK_OUTBOX_CONTRACT | **[S1]** |
| D14 | New Projection: use FUNNEL + SK_VERSION_GUARD | **[S2]** |
| D15 | Read use-case: consult SK_READ_CONSISTENCY first | **[S3]** |
| D16 | SLA values: reference SK_STALENESS_CONTRACT constants | **[S4]** |
| D17 | New external entry points: satisfy SK_RESILIENCE_CONTRACT | **[S5]** |
| D18 | Claims refresh: coordinate via SK_TOKEN_REFRESH_CONTRACT | **[S6]** |
| D19 | Type ownership: cross-BC contracts in `shared.kernel.*` first; `shared/types` is legacy fallback | — |
| D20 | Import precedence: `shared.kernel.*` > feature slice `index.ts` > `shared/types` | — |
| D21 | New tag category: define in CTA `TAG_ENTITIES`; no slice may create own semantic tag category | — |
| D22 | Cross-slice tag reference: point to TAG_USER_LEVEL/TAG_SKILL/TAG_SKILL_TIER/TAG_TEAM/TAG_ROLE/TAG_PARTNER nodes | — |
| D23 | Tag annotation: node text `→ tag::{category} [{NODE_NAME}]`; edge `-.->|"{dim} tag 語義"| NODE_NAME` | — |

---

## Firebase Functions Async Constraints

| Constraint | Value | Notes |
|-----------|-------|-------|
| Max execution time (Firestore-triggered) | 540s | For outbox-relay and dlq-manager functions |
| Max execution time (HTTP-triggered) | 60s (default) / 3600s (2nd gen) | Server Actions proxy via App Hosting |
| DLQ retry budget | 3 attempts | After 3 failures → DLQ with tier tag [R1] |
| Node.js runtime | 20 LTS | Matches `functions/` workspace requirement |
| Outbox scan strategy | Firestore `onSnapshot` (CDC) | Real-time change detection; not polling |
| `relay_lag` metric | Must be emitted | Per delivery attempt → VS9 `domain-metrics` |
