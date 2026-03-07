---
name: x-repomix-skill-and-context-generate
description: Invoke the x-repomix-bootstrap prompt to prepare the environment, then generate the Repomix skill package and repository context.
---

# Copilot Browser Agent Task

This prompt coordinates the full Repomix workflow.

Execution order:

1. Call **x-repomix-bootstrap.prompt.md**
2. Generate the Repomix skill package
3. Generate the repository compressed context

Do not skip steps.

---

# Phase 1 — Bootstrap Environment

Invoke the bootstrap prompt:

x-repomix-bootstrap.prompt.md

This step ensures:

- Node.js installed
- npm installed
- repomix installed globally

Continue only after the environment is confirmed working.

---

# Phase 2 — Generate Repomix Skill

Run:

repomix --skill-generate xuanwu-skill --skill-output ./skills --force

This command must generate the following structure:

skills/
skills/references/
skills/references/files.md
skills/references/project-structure.md
skills/references/summary.md
skills/references/tech-stack.md
skills/SKILL.md

If the folder already exists, overwrite using the --force flag.

Verify all files exist before continuing.

---

# Phase 3 — Generate Repomix Context

Run:

npx repomix --config repomix.config.ts

Expected output:

skills\references\files.md

Verify the file exists and is not empty.

---

# Phase 4 — Output Verification

Confirm the following outputs exist:

skills/
skills/references/files.md
skills/references/project-structure.md
skills/references/summary.md
skills/references/tech-stack.md
skills/SKILL.md

skills\references\files.md

If any file is missing:

1. Re-run the relevant command
2. Inspect errors
3. Fix and retry

---

# Final State

The repository must contain:

skills/
skills\references\files.md

Both must be successfully generated using Repomix.
