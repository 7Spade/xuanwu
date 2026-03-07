---
name: x-repomix-bootstrap
description: Start from GitHub Copilot Agents Browser and bootstrap a clean machine from zero, installing Node.js, npm, and Repomix.
---

> Scope Guard:
> - This prompt is for environment bootstrap only.
> - Do NOT use this prompt for architecture refactor, slice restructuring, file migration, or D-rule remediation.
> - For architecture refactor tasks, use `.github/prompts/x-arch-remediation.prompt.md`.

# Copilot Browser Agent Task

Your task begins from a clean environment inside **GitHub Copilot Agents Browser**.

Assume the machine may have **no development tools installed**.

You must bootstrap the environment from **zero → working Repomix installation**.

Execute the phases strictly in order.

---

# Phase 1 — System Check

Check whether Node.js and npm already exist.

Run:

node -v
npm -v

If both commands succeed, proceed to Phase 3.

If either command fails, continue to Phase 2.

---

# Phase 2 — Install Node.js (includes npm)

Install the **Node.js LTS version**.

After installation verify:

node -v
npm -v

Both commands must return a version number before continuing.

Do not proceed if installation failed.

---

# Phase 3 — Prepare Working Directory

Ensure you are operating inside the repository root.

Confirm the directory contains source files or a project workspace.

If a package.json exists, note it for later dependency installation.

---

# Phase 4 — Install Repomix Globally

Install Repomix CLI globally using npm.

Command:

npm install -g repomix

Wait for installation to finish.

---

# Phase 5 — Verify Repomix

Confirm Repomix was installed correctly.

Run:

repomix --version

The command must output a version number.

If the command fails:

1. Re-run the installation
2. Investigate npm errors
3. Retry until the command succeeds

---

# Phase 6 — (Optional) Install Project Dependencies

If the repository contains a package.json file:

npm install

Wait until dependency installation finishes.

---

# Phase 7 — Ready State

At completion the environment must support:

node
npm
repomix

Verify again:

node -v
npm -v
repomix --version

All commands must succeed.

---

# Phase 8 — Generate Xuanwu Skill

Run:

repomix --skill-generate xuanwu-skill --skill-output ./skills --force

Verify `skills/` exists and contains generated files.

Strict rule:
- Do not edit or rewrite generated output files.
- Treat generated output under `skills/` as the final skill package.

---

# Final Goal

The environment must be ready for future commands such as:

repomix
repomix --skill-generate <skill-name>

Do not finish the task until Node.js, npm, and Repomix are fully working.
