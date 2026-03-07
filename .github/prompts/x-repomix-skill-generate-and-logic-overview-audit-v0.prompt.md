---
name: repomix-architecture-audit
description: Bootstrap environment via x-repomix-bootstrap, generate skill + context via x-repomix-bootstrap-and-skill-generate, then audit repository architecture against docs/architecture/00-LogicOverview.md using the compressed context as input.
---

# Copilot Browser Agent 指令

You are an automated coding agent performing an architecture audit.

Execute **all phases sequentially**. Do not skip any phase.

---

# Phase 1 — Environment Bootstrap

Invoke the following prompt to prepare the execution environment:

```
.github/prompts/x-repomix-bootstrap.prompt.md
```

This step guarantees:

- Node.js LTS installed and verified
- npm available
- Repomix CLI installed globally and verified

**Do not proceed to Phase 2 until the environment is confirmed working.**

---

# Phase 2 — Generate Skill Package & Compressed Context

Invoke the following prompt to generate the Repomix outputs:

```
.github/prompts/x-repomix-bootstrap-and-skill-generate.prompt.md
```

This step produces:

- `docs/ai/repomix-output.context.md` — compressed codebase context
- `skills/` — Repomix skill package

Verify both outputs exist and are non-empty before continuing.

---

# Phase 3 — Load Sources of Truth

Load and fully read the following two documents.

**Primary SSOT — Architecture rules:**

```
docs/architecture/00-LogicOverview.md
```

**Secondary input — Compressed codebase context:**

```
docs/ai/repomix-output.context.md
```

`00-LogicOverview.md` is the authoritative design document.
`repomix-output.context.md` is the snapshot of the current implementation.

---

# Phase 4 — Architecture Consistency Audit

Cross-reference the two documents loaded in Phase 3.

Identify all gaps across the following dimensions:

- **Missing Elements** — feature slices, domain modules, or layers required by the architecture but absent in the codebase
- **Misplaced Elements** — files or modules located outside their correct domain boundary
- **Naming Inconsistencies** — naming that deviates from conventions defined in `00-LogicOverview.md`
- **Boundary Violations** — illegal cross-slice imports, direct Firebase access bypassing `FIREBASE_ACL`, or logic placed outside its designated layer
- **Event Flow Gaps** — missing or incorrect use of outbox, IER lanes, or event routing
- **Responsibility Violations** — side-effects not going through VS7, semantic tags not exclusively managed in VS8, or cost-semantic logic duplicated outside VS8

---

# Phase 5 — Produce Analysis Report

Output a structured report that describes **what must change in the current repository to align with the architecture**.

The report must include:

- Missing modules or folders (with suggested locations)
- Misplaced modules (with suggested target locations)
- Naming inconsistencies (current name → expected name)
- Violations of rules defined in `docs/architecture/00-LogicOverview.md` (reference the specific rule, e.g. D24, D26, A1)
- Suggested refactoring actions, listed as an actionable checklist

---

# Execution Constraints

- Treat `docs/architecture/00-LogicOverview.md` as the **absolute authoritative design document**
- Use `docs/ai/repomix-output.context.md` as the **sole basis for understanding the current codebase state** — do not guess the project structure
- Do not modify any source files automatically; only produce the analysis report
- Prefer deterministic reasoning over assumptions
- If required files are missing, report them explicitly before continuing
- Reference specific rules (D-rules, A-numbers, S-contracts) when identifying violations
