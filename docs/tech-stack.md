# Tech Stack

> **SSOT**: `docs/logic-overview.md` (rules D1–D23, slice boundaries) · `docs/project-structure.md` (folder ownership)
> This file: runtime + library versions only. Governance rules → `logic-overview.md`.

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

## Firebase Functions Async Constraints

| Constraint | Value | Notes |
|-----------|-------|-------|
| Max execution time (Firestore-triggered) | 540s | For outbox-relay and dlq-manager functions |
| Max execution time (HTTP-triggered) | 60s (default) / 3600s (2nd gen) | Server Actions proxy via App Hosting |
| DLQ retry budget | 3 attempts | After 3 failures → DLQ with tier tag [R1] |
| Node.js runtime | 20 LTS | Matches `functions/` workspace requirement |
| Outbox scan strategy | Firestore `onSnapshot` (CDC) | Real-time change detection; not polling |
| `relay_lag` metric | Must be emitted | Per delivery attempt → VS9 `domain-metrics` |
