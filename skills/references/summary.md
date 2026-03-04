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

## Notes

- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: **/*
- Files matching these patterns are excluded: **/*.md, **/*.test.ts, **/*.svg, **/types/generated.ts, **/*.md, .codacy/**, .firebase/**, .github/**, .idx/**, .next/**, docs/**, public/**, skills/**, .aiexclude, .firebaserc, .gitattributes, .gitignore, .modified, .prettierrc, apphosting.yaml, components.json, eslint.config.mts, next.config.ts, postcss.config.mjs, README.md, repomix.config.ts, **/node_modules/**, **/dist/**, **/build/**, **/.git/**, package-lock.json, repomix-output.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Files are sorted by Git change count (files with more changes are at the bottom)

## Statistics

601 files | 9,344 lines

| Language | Files | Lines |
|----------|------:|------:|
| TypeScript | 349 | 5,876 |
| TypeScript (TSX) | 231 | 3,078 |
| Markdown | 8 | 26 |
| JSON | 7 | 309 |
| No Extension | 2 | 15 |
| RULES | 2 | 21 |
| CSS | 1 | 18 |
| JavaScript | 1 | 1 |

**Largest files:**
- `src/features/workspace.slice/core/_components/workspace-settings.tsx` (340 lines)
- `src/config/i18n/i18n.schema.ts` (236 lines)
- `src/features/workspace.slice/core.event-bus/_events.ts` (154 lines)
- `package.json` (131 lines)
- `src/features/organization.slice/core.event-bus/_events.ts` (126 lines)
- `src/features/workspace.slice/business.document-parser/_intent-actions.ts` (98 lines)
- `src/shared/infra/firestore/repositories/workspace-core.repository.ts` (87 lines)
- `src/features/workspace.slice/core/_components/workspace-provider.tsx` (83 lines)
- `src/features/workspace.slice/business.tasks/_components/tasks-view.tsx` (82 lines)
- `src/features/scheduling.slice/_components/proposal-dialog.tsx` (79 lines)