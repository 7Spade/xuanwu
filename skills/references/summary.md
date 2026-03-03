This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where line numbers have been added, content has been compressed (code blocks are separated by ⋮---- delimiter).

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
- Files matching these patterns are excluded: dataconnect-generated/, documentai-templates/, schematics/, src/assets/i18n/data/, node_modules/, .pnpm-store/, .yarn/, .yarn-cache/, dist/, build/, out/, coverage/, .angular/, .angular/cache/, playwright-report/, .playwright/, .firebase/, .firebaserc, .emulators/, dataconnect/, .cache/, .tmp/, temp/, *.log, *.tmp, .vscode/, .idea/, *.swp, *.swo, *~, .DS_Store, Thumbs.db, desktop.ini, *.map, *.d.ts.map, *.tsbuildinfo, package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lockb, *.png, *.jpg, *.jpeg, *.gif, *.ico, *.svg, *.webp, *.avif, *.mp4, *.webm, *.ogg, *.mp3, *.wav, *.pdf, *.woff, *.woff2, *.ttf, *.eot, *.otf, *.spec.ts, *.spec.js, *.test.ts, *.test.js, e2e/, tests/, __tests__/, playwright.config.ts, .git/, .gitignore, .gitkeep, .gitattributes, .github/, .husky/, .codacy/, .github/instructions/archive/, docs/archive/, docs/, .editorconfig, .npmignore, .npmrc, .nvmrc, .prettierignore, .prettierrc, .prettierrc.js, .prettierrc.json, .yarnrc.yml, apphosting.yaml, stylelint.config.mjs, firebase.json, scripts/, LICENSE, CHANGELOG.md, *.txt, src/assets/tmp/, public/tmp/, repo-context.xml, repo-context.md, repo-context.txt, repo-context.json
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Line numbers have been added to the beginning of each line
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Long base64 data strings (e.g., data:image/png;base64,...) have been truncated to reduce token count

## Statistics

605 files | 22,698 lines

| Language | Files | Lines |
|----------|------:|------:|
| TypeScript | 349 | 16,835 |
| TypeScript (TSX) | 219 | 4,255 |
| Markdown | 13 | 460 |
| JSON | 13 | 944 |
| No Extension | 4 | 34 |
| RULES | 2 | 21 |
| NIX | 1 | 80 |
| MTS | 1 | 34 |
| JavaScript (ESM) | 1 | 1 |
| CSS | 1 | 32 |
| Other | 1 | 2 |

**Largest files:**
- `public/localized-files/en.json` (286 lines)
- `public/localized-files/zh-TW.json` (286 lines)
- `src/features/organization.slice/core.event-bus/_events.ts` (283 lines)
- `src/shared/constants/skills.ts` (281 lines)
- `src/features/scheduling.slice/_aggregate.ts` (266 lines)
- `.idx/airules.md` (239 lines)
- `src/config/i18n/i18n.schema.ts` (236 lines)
- `src/shared/types/workspace.types.ts` (233 lines)
- `src/features/workspace.slice/core.event-bus/_events.ts` (230 lines)
- `src/features/infra.external-triggers/_guard.ts` (192 lines)