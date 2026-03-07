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
- Only files matching these patterns are included: **/*
- Files matching these patterns are excluded: src/app/favicon.ico, src/app/globals.css, **/*.md, **/*.test.ts, **/*.svg, **/types/generated.ts, **/*.md, .codacy/**, .firebase/**, .github/**, .idx/**, .next/**, docs/**, public/**, skills/**, .aiexclude, .firebaserc, .gitattributes, .gitignore, .modified, .prettierrc, apphosting.yaml, components.json, eslint.config.mts, next.config.ts, postcss.config.mjs, README.md, repomix.config.ts, **/node_modules/**, src/shared-infra/firebase/functions/lib/**, src/shared/shadcn-ui/**, tailwind.config.ts, vitest.config.ts, **/dist/**, **/build/**, **/.git/**, package-lock.json, repomix-output.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Files are sorted by Git change count (files with more changes are at the bottom)

## Statistics

622 files | 10,667 lines

| Language | Files | Lines |
|----------|------:|------:|
| TypeScript | 406 | 7,173 |
| TypeScript (TSX) | 202 | 3,134 |
| JSON | 7 | 313 |
| Markdown | 2 | 10 |
| No Extension | 2 | 15 |
| RULES | 2 | 21 |
| JavaScript | 1 | 1 |

**Largest files:**
- `src/features/workspace.slice/core/_components/workspace-settings.tsx` (340 lines)
- `src/config/i18n/i18n.schema.ts` (236 lines)
- `src/features/workspace.slice/core.event-bus/_events.ts` (172 lines)
- `src/features/semantic-graph.slice/centralized-types/index.ts` (138 lines)
- `src/features/workspace.slice/business.document-parser/_intent-actions.ts` (136 lines)
- `package.json` (135 lines)
- `src/features/organization.slice/core.event-bus/_events.ts` (126 lines)
- `src/shared/infra/firestore/repositories/workspace-core.repository.ts` (87 lines)
- `src/features/workspace.slice/core/_actions.ts` (76 lines)
- `src/features/scheduling.slice/_components/proposal-dialog.tsx` (75 lines)