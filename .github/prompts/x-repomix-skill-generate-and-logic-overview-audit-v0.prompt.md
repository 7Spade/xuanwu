---
name: repomix-architecture-audit
description: Setup Node environment, generate Repomix skill, and audit repository architecture against docs/architecture/00-LogicOverview.md
---

### Copilot Browser Agent 指令

Set up the environment and generate the Repomix skill for this repository, then analyze architectural alignment.

Steps must be executed sequentially.

1. Verify that **Node.js LTS and npm are installed**.

   * If Node.js is missing, install the latest **LTS version**.
   * Confirm both `node` and `npm` commands are available.

2. Install the CLI tool **repomix** globally.

Command to run:

```
npm install -g repomix
```

3. Run Repomix using the repository configuration.

Command to run:

```
npx repomix --config repomix.config.ts
```

4. Generate the Repomix skill.

Command to run:

```
repomix --skill-generate xuanwu-skill --skill-output ./skills --force
```

Requirements:

* Output directory must be `./skills`
* Existing files should be overwritten
* Ensure the command finishes successfully

5. After skill generation completes, perform an **architecture consistency analysis**.

Use the following file as the **source of truth**:

```
docs/architecture/00-LogicOverview.md
```

Compare the current repository implementation with the design described in that document.

Specifically analyze:

* Feature slices
* Domain boundaries
* Event flows
* Module structure
* Folder layout

6. Produce a report describing **what must change in the current repository to align with the architecture**.

The report must include:

* Missing modules or folders
* Misplaced modules
* Naming inconsistencies
* Violations of the architecture defined in `00-LogicOverview.md`
* Suggested refactoring actions

Output the analysis as a structured report.

---

### 給 Copilot Agent 的額外保險（建議加上）

這段會讓 Copilot **更穩定完成任務**：

Add the following constraints while performing the analysis:

* Treat `docs/architecture/00-LogicOverview.md` as the **authoritative design document**
* Do not modify files automatically
* Only produce an analysis report
* Prefer deterministic reasoning over assumptions
* If required files are missing, report them explicitly

---
