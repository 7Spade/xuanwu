This file is a merged representation of a subset of the codebase, containing specifically included files and files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed, content has been compressed (code blocks are separated by ⋮---- delimiter).

# Summary

## Purpose

This is a reference codebase organized into multiple files for AI consumption.
It is designed to be easily searchable using grep and other text-based tools.

## File Structure

This skill contains the following reference files:

| File | Contents |
|------|----------|
| `project-structure.md` | Directory tree with line counts per file |
| `files.md` | All file contents (search with `## File: <path>`) |
| `tech-stack.md` | Languages, frameworks, and dependencies |
| `summary.md` | This file - purpose and format explanation |

## Usage Guidelines

- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

- Pay special attention to the Repository Instruction. These contain important context and guidelines specific to this project.

## Notes

- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: src/features/semantic-graph.slice/**/*.ts, src/features/semantic-graph.slice/**/*.tsx, src/features/workforce-scheduling.slice/**/*.ts, src/features/workforce-scheduling.slice/**/*.tsx, src/shared-kernel/**/*.ts, src/shared-kernel/**/*.tsx, src/shared-infra/**/*.ts, src/shared-infra/**/*.tsx
- Files matching these patterns are excluded: src/app/favicon.ico, src/app/globals.css, **/*.md, **/*.test.ts, **/*.svg, **/types/generated.ts, **/*.md, .codacy/**, .firebase/**, .github/**, .idx/**, .next/**, docs/**, public/**, skills/**, .aiexclude, .firebaserc, .gitattributes, .gitignore, .modified, .prettierrc, apphosting.yaml, components.json, eslint.config.mts, next.config.ts, postcss.config.mjs, README.md, repomix.config.ts, **/node_modules/**, src/shared-infra/backend-firebase/functions/lib/**, src/shared/shadcn-ui/**, tailwind.config.ts, vitest.config.ts, **/dist/**, **/build/**, **/.git/**, package-lock.json, repomix-output.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Files are sorted by Git change count (files with more changes are at the bottom)

## Statistics

260 files | 4,951 lines

| Language | Files | Lines |
|----------|------:|------:|
| TypeScript | 241 | 4,501 |
| TypeScript (TSX) | 19 | 450 |

**Largest files:**
- `src/features/semantic-graph.slice/core/types/index.ts` (139 lines)
- `src/features/workforce-scheduling.slice/ports/command.port.ts` (93 lines)
- `src/shared-infra/frontend-firebase/firestore/repositories/workspace-core.repository.ts` (87 lines)
- `src/features/workforce-scheduling.slice/ui/components/runtime/proposal-dialog.tsx` (75 lines)
- `src/shared-kernel/data-contracts/account/account-contract.ts` (74 lines)
- `src/features/semantic-graph.slice/_types.ts` (68 lines)
- `src/shared-infra/external-triggers/_guard.ts` (64 lines)
- `src/shared-kernel/data-contracts/skill-tier/index.ts` (63 lines)
- `src/features/workforce-scheduling.slice/domain/aggregate/index.ts` (63 lines)
- `src/shared-kernel/data-contracts/tag-authority/index.ts` (62 lines)