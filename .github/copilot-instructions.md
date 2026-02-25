# Copilot Instructions for `7Spade/xuanwu`

This repository is onboarding Copilot with a **minimal, architecture-first rule set**.

## Core principles
- Follow **Occam's Razor**: prefer the simplest change that fully solves the task.
- Keep code in the repository's **Vertical Slice Architecture (VSA)**.
- Keep changes **small and local**; avoid creating new abstractions unless required.

## Architecture rules (must follow)
- Top-level structure:
  - `src/app`: Next.js App Router composition only
  - `src/features`: business-domain vertical slices
  - `src/shared`: cross-cutting infrastructure
  - `src/shared-kernel`: core domain models and utilities shared across features
- Dependency direction:
  - `app -> features/{slice}/index.ts -> shared`
- Cross-slice access:
  - Import from another slice via its `index.ts` public API only.
  - Do not import private `_` files across slices.

## Parallel routes + Next.js App Router
- The project uses **parallel routes** (for example `@sidebar`, `@modal`, `@header`, `@plugintab`) and route groups.
- Keep layouts thin: compose slots and shared chrome, do not add feature business logic in layout files.
- Preserve current route behavior when editing slot routes or intercepting routes.

## Next.js 16 & Data Mutations
- Prefer **Server Actions** placed in `src/features/{slice}/actions.ts` for data mutations.
- Use React 19 / Next.js 16 hooks like `useActionState` and `useFormStatus` for form handling. Do not use legacy `useFormState`.
- Ensure Server Actions return serializable objects or standard error formats (e.g., `{ success: boolean, error?: string, data?: any }`).

## UI & Styling
- [請填寫你的樣式庫，例如：Use Tailwind CSS v4 for styling. Do not write inline CSS or standard CSS modules.]
- [請填寫你的 UI 元件庫，例如：Use standard components from `src/shared/components/ui/` (shadcn/ui) before creating custom ones.]

## Agent Task Workflow & MCP
- **Plan first**: When receiving a task, outline the files you will touch before writing code.
- **Context gathering**: If modifying database schemas or API contracts, utilize available MCP tools (e.g., Database MCP or GitHub MCP) to verify the current state first.
- **Test driven**: If modifying a feature, check for existing tests in the slice (e.g., `src/features/{slice}/__tests__`) and update them accordingly.

## Working style for Copilot
- Prioritize existing patterns in `src/features/*`, `src/app/*`, `src/shared`, and `src/shared-kernel/*`.
- Prefer server-first Next.js patterns and minimal client boundaries (use `"use client"` only at the leaf nodes).
- Validate with existing commands when relevant:
  - `npm run lint`
  - `npm run typecheck`