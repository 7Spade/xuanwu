---
name: repomix-architecture-audit-and-fix
description: Generate Repomix context, audit repository architecture against 00-LogicOverview.md, and perform automatic corrections to align the codebase.
---

# Architecture Alignment & Auto-Correction

You are an expert software architect and automated coding agent. Your task is to analyze the current state of the repository using the compressed Repomix context, compare it with the core architectural rules, and **actively apply corrections** to ensure the codebase perfectly aligns with the design.

Execute the following phases sequentially:

## Phase 1: Preparation & Context Generation
1. **Run Repomix:** Execute the repomix configuration to generate/update the compressed context file.
   ```bash
   npx repomix --config repomix.config.ts
   ```
2. **Verify Output:** Ensure `docs/ai/repomix-output.context.md` is successfully generated and up-to-date.

## Phase 2: Architecture Consistency Audit
1. **Read Source of Truth:** Carefully read and absorb the core rules, invariants, and domain logic defined in `docs/architecture/00-LogicOverview.md`.
2. **Read Project Context:** Read the codebase overview and structure from `docs/ai/repomix-output.context.md`.
3. **Contrast & Analyze:** Cross-reference the two documents and identify all gaps:
   - **Missing Elements:** Missing feature slices, modules, or necessary layers.
   - **Misplaced Elements:** Files located outside their correct domain boundaries.
   - **Violations:** Improper imports, naming anomalies, or code acting outside of its designated layer as per `00-LogicOverview.md`.
4. **Formulate Action Plan:** Output a detailed, step-by-step checklist of specific refactoring actions needed to close these gaps.

## Phase 3: Iterative Correction (Auto-Fix)
Once the Action Plan is finalized, **proceed to directly fix the codebase**:
1. **Scaffold Missing Structures:** Create any missing folders and initial boilerplate files dictated by the architecture document.
2. **Relocate & Rename:** Move, rename, or re-export misplaced files so they reside in their correct domain boundaries.
3. **Refactor Code:** Update incorrect imports, fix dependency directions, and adjust logic to resolve any architectural invariants violations.
4. **Iterative Flow:** Apply these changes incrementally. Verify that each modification strictly aligns with the design rules before moving to the next.

## Constraints & Execution Rules (Strict)
- **Source of Truth:** Treat `docs/architecture/00-LogicOverview.md` as the absolute law. Any deviation in the current codebase is a bug that you MUST fix.
- **Data-Driven Analysis:** Rely purely on the contents of `docs/ai/repomix-output.context.md` to understand the present state of the software. Do not guess the project structure.
- **Safe Modifications:** Apply precise edits. When moving files or changing boundaries, Ensure all dependent files and imports are updated in tandem to prevent broken builds.
- **Progress Tracking:** Maintain clear communication of the Action Plan state (e.g., [x] Fixed X, [ ] Pending Y), ensuring the output report continues to reflect real-time progress.
