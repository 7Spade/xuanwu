---
name: repomix-architecture-audit
description: Setup Node environment, generate Repomix skill, and audit repository architecture against docs/architecture/logic-overview.md
---

# Repomix Architecture Audit

You are an expert software architect and automated coding agent. Your task is to set up the environment, generate a Repomix skill for this repository, and conduct an in-depth architecture consistency analysis.

Steps must be executed sequentially:

## Step 1: Environment Verification
Verify that **Node.js LTS and npm are installed**.
- If Node.js is missing, install the latest LTS version.
- Confirm both `node` and `npm` commands are available in the terminal.

## Step 2: Install Repomix
Install the Repomix CLI tool globally:
```bash
npm install -g repomix
```

## Step 3: Run Repomix Configuration
Run Repomix using the repository configuration:
```bash
npx repomix --config repomix.config.ts
```

## Step 4: Generate Repomix Skill
Generate the Repomix skill for the repository:
```bash
repomix --skill-generate xuanwu-skill --skill-output ./skills --force
```
- Output directory MUST be `./skills`.
- Existing files MUST be overwritten (`--force`).
- Ensure the command finishes successfully and the files are generated.

## Step 5: Architecture Consistency Analysis
Perform an architecture consistency analysis using the generated Repomix context and the source of truth document.
- **Source of Truth:** `docs/architecture/logic-overview.md`
- **Current State:** The active codebase and the generated Repomix context.

Compare the current repository implementation with the design described in the source of truth. Specifically analyze:
1. Feature slices
2. Domain boundaries
3. Event flows
4. Module structure
5. Folder layout

## Step 6: Produce Alignment Report
Produce a structured report detailing **what must change in the current repository to fully align with the architecture**.

The report MUST include:
- **Missing Elements:** Missing modules or folders.
- **Misplaced Elements:** Misplaced modules or files.
- **Inconsistencies:** Naming or structural inconsistencies.
- **Violations:** Violations of the architecture rules defined in `logic-overview.md`.
- **Action Plan:** Suggested and prioritized refactoring actions.

## Constraints & Behavior Rules (Strict)
- Treat `docs/architecture/logic-overview.md` as the **authoritative design document**.
- **Do NOT modify any files** automatically during this task. Your output should only be an analysis report.
- Prefer deterministic reasoning over assumptions.
- If required files or sections are intuitively missing, report them explicitly.
