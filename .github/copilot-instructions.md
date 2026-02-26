# Copilot Instructions for `7Spade/xuanwu`

This repository is onboarding Copilot with a **minimal, architecture-first rule set**, integrated with **Memory MCP** for long-term project context.

## Core principles
- Follow **Occam's Razor**: prefer the simplest change that fully solves the task.
- Keep code in the repository's **Vertical Slice Architecture (VSA)**.
- Keep changes **small and local**; avoid creating new abstractions unless required.

## Memory MCP & Knowledge Graph (Crucial)
You must actively maintain the project's knowledge graph using the `memory` tool:
- **Initialize & Sync**: Upon start or when requested, read `.github/prompts/*.md` to sync governance rules into memory.
- **Read First**: Before any task, use `read_graph` or `search_nodes` to recall architecture decisions and domain constraints.
- **Write Ongoing (The Habit)**:
  - **Feature Completion**: When a new feature or vertical slice is completed, create entities/relations to document its public API and dependencies.
  - **Error Learning**: After fixing a complex bug, record the "Root Cause" and "Solution" as an observation in memory to prevent regression.
  - **Architecture Decided**: If a new pattern is established (e.g., a specific way to handle Parallel Routes), log it as an `Architecture_Decision` entity.

## Architecture rules (must follow)
- Top-level structure:
  - `src/app`: Next.js App Router composition only.
  - `src/features`: Business-domain vertical slices.
  - `src/shared`: Cross-cutting infrastructure.
  - `src/features/shared-kernel`: Core domain models and utilities shared across features.
- Dependency direction:
  - `app -> features/{slice}/index.ts -> shared`
- Cross-slice access:
  - Import from another slice via its `index.ts` public API only. Do not import private `_` files across slices.

## Parallel routes + Next.js App Router
- The project uses **parallel routes** (e.g., `@sidebar`, `@modal`, `@header`, `@plugintab`) and route groups.
- Keep layouts thin: compose slots and shared chrome, do not add feature business logic in layout files.
- Preserve current route behavior when editing slot routes or intercepting routes.

## Next.js 16 & Data Mutations
- Prefer **Server Actions** placed in `src/features/{slice}/actions.ts` for data mutations.
- Use React 19 / Next.js 16 hooks like `useActionState` and `useFormStatus` for form handling. Do not use legacy `useFormState`.
- Ensure Server Actions return serializable objects: `{ success: boolean, error?: string, data?: any }`.

## UI & Styling
- **Styling**: Use **Tailwind CSS** for all styling. Follow the existing theme configuration.
- **Components**: Use standard components from `src/shared/components/ui/` (**shadcn/ui**) before creating custom ones.
- **Icons**: Use **Lucide React** for all iconography.

## Agent Task Workflow & MCP
- **Plan first**: Outline the files you will touch and **query Memory MCP** for relevant rules before writing code.
- **Context gathering**: Utilize `fetch` for latest docs or `postgres` MCP to verify schemas if modifying data-heavy features.
- **Closing the Loop**: Once the task is done, update the Memory Graph with any new technical debt or patterns discovered.

## Working style for Copilot
- Prioritize existing patterns in `src/features/*`, `src/app/*`, `src/shared`, and `src/features/shared-kernel/*`.
- Prefer server-first Next.js patterns and minimal client boundaries (use `"use client"` only at leaf nodes).
- Validate with existing commands: `npm run lint`, `npm run typecheck`.