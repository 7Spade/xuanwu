---
name: repomix-bootstrap-and-skill-generate
description: Bootstrap Node.js environment, install Repomix, generate repository context, and generate the xuanwu skill package.
---

# Repomix Environment Bootstrap + Skill Generation

You are an automated coding agent responsible for preparing the repository environment and generating the Repomix context and skill files.

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

# Phase 4 — Generate Repomix Context

Run the repository context compression using the configuration file.

npx repomix --config repomix.config.ts

Expected output:

docs/ai/repomix-output.context.md

Verify that this file exists and is not empty.

---

# Phase 5 — Generate Xuanwu Skill

Generate the Repomix skill package.

repomix --skill-generate xuanwu-skill --skill-output ./skills --force

Expected output directory:

skills/

Verify the directory exists and contains generated skill files.

---

# Phase 6 — Output Validation

Confirm the following artifacts exist:

docs/ai/repomix-output.context.md
skills/

If either artifact is missing:
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

The repository must contain:

docs/ai/repomix-output.context.md
skills/

Both must be generated successfully using Repomix.
