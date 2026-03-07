---
name: repomix-bootstrap-and-skill-generate
description: Bootstrap Node.js environment, install Repomix, generate repository context, and generate the xuanwu skill package.
---

# Repomix Environment Bootstrap + Skill Generation

You are an automated coding agent responsible for preparing the repository environment and generating the Repomix skill files.

Execute the following phases sequentially.

---

# Phase 1 — Environment Bootstrap

Check whether Node.js is installed.

If Node.js is missing:
- Install Node.js LTS
- Verify installation

Run:

node -v
npm -v

Both commands must succeed before continuing.

---

# Phase 2 — Install Repomix

Install Repomix globally.

npm install -g repomix

Verify installation:

repomix --version

---

# Phase 3 — Install Project Dependencies

If a package.json exists in the repository root, run:

npm install

Ensure installation completes successfully before continuing.

---

# Phase 4 — Generate Xuanwu Skill

Generate the Repomix skill package.

repomix --skill-generate xuanwu-skill --skill-output ./skills --force

Expected output directory:

skills/

Verify the directory exists and contains generated skill files.

Treat the generated output under `skills/` as the repository skill package.

---

# Phase 5 — Output Validation

Confirm the following artifacts exist:

skills/
skills/SKILL.md
skills/references/files.md
skills/references/project-structure.md
skills/references/summary.md

If any artifact is missing:
1. Re-run the relevant command
2. Inspect errors
3. Fix and retry

Do not finish until both outputs exist.

---

# Execution Rules

1. Execute phases sequentially
2. Do not skip environment setup
3. Always verify outputs
4. Retry failed commands after fixing issues
5. Do not terminate early

---

# Final Result

The repository must contain a generated skill package under `skills/`.

This package must be generated successfully using Repomix and used directly as the skill artifact.
