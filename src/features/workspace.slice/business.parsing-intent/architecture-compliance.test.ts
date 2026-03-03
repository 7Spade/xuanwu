/**
 * @test Architecture compliance — VS5×VS6 integration invariants
 *
 * Verifies that the key structural requirements established by the problem statement
 * are correctly implemented in the domain model and event contracts:
 *
 *  [#A4] Digital Twin Protocol — ParsingIntent emits domain events with SourcePointer
 *  [S2]  aggregateVersion — WorkspaceTask supports optimistic concurrency
 *  [TE_SK] tag::skill — tasks carry SkillRequirement[] for VS6 eligibility gate
 *  [D24] Firebase ACL — no direct firebase/firestore imports in feature slices
 *  [D7]  Cross-slice integrity — scheduling reads workspace data via projection only
 *
 * Note: These are structural/contract tests. They verify that the implementation
 * has the correct shape without requiring a live Firebase connection.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── [#A4] ParsingIntentContract structural shape ─────────────────────────────
import type { ParsingIntentContract } from '@/features/workspace.slice/business.parsing-intent/_contract';
import { createParsingIntentContract } from '@/features/workspace.slice/business.parsing-intent/_contract';

// ─── Event payload contracts ──────────────────────────────────────────────────
import type {
  IntentDeltaProposedPayload,
  WorkspaceTaskAssignedPayload,
  DocumentParserItemsExtractedPayload,
} from '@/features/workspace.slice/core.event-bus/_events';

// ─── Cross-BC contracts ────────────────────────────────────────────────────────
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import type { SkillRequirement } from '@/features/shared-kernel';

const SRC_ROOT = path.resolve(process.cwd(), 'src');

// ─── D24 helpers ──────────────────────────────────────────────────────────────

/** Recursively collect all .ts/.tsx source files under a directory, excluding tests and node_modules. */
function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(full);
    }
  }
  return files;
}

/** Returns files that import directly from 'firebase/firestore' or 'firebase/app'. */
function findDirectFirebaseImports(dir: string): string[] {
  return collectSourceFiles(dir).filter((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return (
      /from ['"]firebase\/firestore['"]/.test(content) ||
      /from ['"]firebase\/app['"]/.test(content)
    );
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('[Architecture] VS5×VS6 integration compliance', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // [#A4] ParsingIntentContract — SourcePointer + SkillRequirements
  // ──────────────────────────────────────────────────────────────────────────
  describe('[#A4] ParsingIntentContract has SourcePointer fields', () => {
    it('sourceFileId is required (SourcePointer — identifies origin document)', () => {
      const contract = createParsingIntentContract({
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileId: 'file-123',
        sourceVersionId: 'v1',
        taskDraftCount: 5,
      });
      // SourcePointer [#A4]: must point to the originating file
      expect(contract.sourceFileId).toBeDefined();
      expect(typeof contract.sourceFileId).toBe('string');
    });

    it('sourceVersionId is required (SourcePointer — identifies file snapshot)', () => {
      const contract = createParsingIntentContract({
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileId: 'file-123',
        sourceVersionId: 'v1',
        taskDraftCount: 5,
      });
      expect(contract.sourceVersionId).toBeDefined();
      expect(typeof contract.sourceVersionId).toBe('string');
    });

    it('skillRequirements is always an array [TE_SK] (never null/undefined)', () => {
      const contract = createParsingIntentContract({
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileId: 'file-123',
        sourceVersionId: 'v1',
        taskDraftCount: 5,
      });
      expect(Array.isArray(contract.skillRequirements)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [#A4] IntentDeltaProposedPayload — event payload structural shape
  // ──────────────────────────────────────────────────────────────────────────
  describe('[#A4] IntentDeltaProposedPayload event shape', () => {
    it('payload type has intentId + workspaceId (Digital Twin anchor)', () => {
      // TypeScript compile-time proof — if this compiles, the interface exists
      const sample: IntentDeltaProposedPayload = {
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileName: 'plan.pdf',
        taskDraftCount: 3,
      };
      expect(sample.intentId).toBeDefined();
      expect(sample.workspaceId).toBeDefined();
    });

    it('payload type carries optional skillRequirements [TE_SK]', () => {
      const skills: SkillRequirement[] = [{ tagSlug: 'mep:hvac', minimumTier: 'journeyman', quantity: 1 }];
      const payload: IntentDeltaProposedPayload = {
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileName: 'plan.pdf',
        taskDraftCount: 2,
        skillRequirements: skills,
      };
      expect(payload.skillRequirements).toHaveLength(1);
    });

    it('payload type supports optional traceId [R8]', () => {
      const payload: IntentDeltaProposedPayload = {
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileName: 'plan.pdf',
        taskDraftCount: 1,
        traceId: 'trace-abc-123',
      };
      expect(payload.traceId).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [TE_SK] WorkspaceTaskAssignedPayload — skill propagation [A5][P4]
  // ──────────────────────────────────────────────────────────────────────────
  describe('[TE_SK] WorkspaceTaskAssignedPayload carries skill requirements', () => {
    it('payload has optional requiredSkills field for VS6 eligibility', () => {
      const skills: SkillRequirement[] = [
        { tagSlug: 'finishing-works:tile', minimumTier: 'artisan', quantity: 1 },
      ];
      const payload: WorkspaceTaskAssignedPayload = {
        taskId: 't1',
        taskName: 'Tile Bathroom',
        assigneeId: 'acc-user-1',
        workspaceId: 'w1',
        requiredSkills: skills,
      };
      expect(payload.requiredSkills).toHaveLength(1);
      expect(payload.requiredSkills![0].tagSlug).toBe('finishing-works:tile');
    });

    it('payload has optional sourceIntentId (SourcePointer propagation [#A4])', () => {
      const payload: WorkspaceTaskAssignedPayload = {
        taskId: 't1',
        taskName: 'Task A',
        assigneeId: 'acc-user-1',
        workspaceId: 'w1',
        sourceIntentId: 'intent-xyz',
      };
      expect(payload.sourceIntentId).toBe('intent-xyz');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [A5] WorkspaceScheduleProposedPayload — cross-BC scheduling contract
  // ──────────────────────────────────────────────────────────────────────────
  describe('[A5] WorkspaceScheduleProposedPayload — cross-BC contract', () => {
    it('has skillRequirements field for VS6 eligibility gate [TE_SK]', () => {
      const skills: SkillRequirement[] = [
        { tagSlug: 'mep:plumbing', minimumTier: 'expert', quantity: 1 },
      ];
      const payload: WorkspaceScheduleProposedPayload = {
        scheduleItemId: 's1',
        workspaceId: 'w1',
        orgId: 'org-1',
        title: 'Plumbing Install',
        startDate: '2026-04-01',
        endDate: '2026-04-05',
        proposedBy: 'acc-pm-1',
        skillRequirements: skills,
      };
      expect(payload.skillRequirements).toHaveLength(1);
      expect(payload.skillRequirements![0].minimumTier).toBe('expert');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [D24] Firebase ACL compliance — feature slices must not import firebase directly
  // ──────────────────────────────────────────────────────────────────────────
  describe('[D24] Firebase ACL — no direct firebase imports in feature slices', () => {
    it('workspace.slice has no direct firebase/firestore imports', () => {
      const violations = findDirectFirebaseImports(
        path.join(SRC_ROOT, 'features', 'workspace.slice')
      );
      if (violations.length > 0) {
        console.error('[D24 violation] Direct firebase imports found:\n', violations.join('\n'));
      }
      expect(violations).toHaveLength(0);
    });

    it('scheduling.slice has no direct firebase/firestore imports', () => {
      const violations = findDirectFirebaseImports(
        path.join(SRC_ROOT, 'features', 'scheduling.slice')
      );
      if (violations.length > 0) {
        console.error('[D24 violation] Direct firebase imports found:\n', violations.join('\n'));
      }
      expect(violations).toHaveLength(0);
    });

    it('app directory has no direct firebase/firestore imports', () => {
      const violations = findDirectFirebaseImports(path.join(SRC_ROOT, 'app'));
      if (violations.length > 0) {
        console.error('[D24 violation] Direct firebase imports found in app:\n', violations.join('\n'));
      }
      expect(violations).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [D7] Cross-slice isolation — scheduling.slice MUST NOT import workspace.slice internals
  // ──────────────────────────────────────────────────────────────────────────
  describe('[D7] Cross-slice isolation — scheduling does not import workspace internals', () => {
    it('scheduling.slice source files do not import from workspace.slice directly', () => {
      const schedulingFiles = collectSourceFiles(
        path.join(SRC_ROOT, 'features', 'scheduling.slice')
      );
      const violations = schedulingFiles.filter((file) => {
        const content = fs.readFileSync(file, 'utf8');
        // D7: direct import of workspace.slice internals is forbidden.
        // Only the public index re-exports via shared-kernel are allowed.
        return /from ['"]@\/features\/workspace\.slice\//.test(content) ||
               /from ['"]\.\.\/workspace\.slice\//.test(content);
      });
      if (violations.length > 0) {
        console.error('[D7 violation] Scheduling imports workspace internals:\n', violations.join('\n'));
      }
      expect(violations).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [ParsingIntentContract] Type-level completeness check
  // ──────────────────────────────────────────────────────────────────────────
  describe('ParsingIntentContract type completeness', () => {
    it('all required fields are present and typed correctly at runtime', () => {
      const contract: ParsingIntentContract = createParsingIntentContract({
        intentId: 'i1',
        workspaceId: 'w1',
        sourceFileId: 'f1',
        sourceVersionId: 'v1',
        taskDraftCount: 2,
        skillRequirements: [{ tagSlug: 'bim:revit', minimumTier: 'expert', quantity: 1 }],
      });

      // All fields required by the contract
      expect(typeof contract.intentId).toBe('string');
      expect(typeof contract.workspaceId).toBe('string');
      expect(typeof contract.sourceFileId).toBe('string');
      expect(typeof contract.sourceVersionId).toBe('string');
      expect(typeof contract.taskDraftCount).toBe('number');
      expect(Array.isArray(contract.skillRequirements)).toBe(true);
      expect(contract.status).toBe('pending');
      expect(typeof contract.createdAt).toBe('number');
      expect(typeof contract.updatedAt).toBe('number');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [D25] IFileStore Adapter — StorageAdapter implements IFileStore
  // ──────────────────────────────────────────────────────────────────────────
  describe('[D25] StorageAdapter implements IFileStore port', () => {
    it('storage.adapter.ts file exists in shared/infra/storage', () => {
      const adapterPath = path.join(SRC_ROOT, 'shared', 'infra', 'storage', 'storage.adapter.ts');
      expect(fs.existsSync(adapterPath)).toBe(true);
    });

    it('StorageAdapter class has upload, getDownloadURL, deleteFile methods', () => {
      const adapterPath = path.join(SRC_ROOT, 'shared', 'infra', 'storage', 'storage.adapter.ts');
      const content = fs.readFileSync(adapterPath, 'utf8');
      expect(content).toMatch(/class StorageAdapter/);
      expect(content).toMatch(/implements IFileStore/);
      expect(content).toMatch(/async upload\(/);
      expect(content).toMatch(/async getDownloadURL\(/);
      expect(content).toMatch(/async deleteFile\(/);
    });

    it('StorageAdapter does not import firebase/storage directly (delegated to adapters)', () => {
      const adapterPath = path.join(SRC_ROOT, 'shared', 'infra', 'storage', 'storage.adapter.ts');
      const content = fs.readFileSync(adapterPath, 'utf8');
      expect(/from ['"]firebase\/storage['"]/.test(content)).toBe(false);
    });

    it('storage/index.ts exports StorageAdapter', () => {
      const indexPath = path.join(SRC_ROOT, 'shared', 'infra', 'storage', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toMatch(/StorageAdapter/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [QGWAY_SCHED] Scheduling queries route through projection.org-eligible-member-view
  // ──────────────────────────────────────────────────────────────────────────
  describe('[QGWAY_SCHED] Scheduling eligible-member queries use projection.bus', () => {
    it('scheduling _queries.ts exports getEligibleMembersForSchedule', () => {
      const queriesPath = path.join(SRC_ROOT, 'features', 'scheduling.slice', '_queries.ts');
      const content = fs.readFileSync(queriesPath, 'utf8');
      expect(content).toMatch(/getEligibleMembersForSchedule/);
    });

    it('scheduling _queries.ts exports getEligibleMemberForSchedule', () => {
      const queriesPath = path.join(SRC_ROOT, 'features', 'scheduling.slice', '_queries.ts');
      const content = fs.readFileSync(queriesPath, 'utf8');
      expect(content).toMatch(/getEligibleMemberForSchedule/);
    });

    it('scheduling _queries.ts imports eligible members from projection.bus (QGWAY_SCHED channel)', () => {
      const queriesPath = path.join(SRC_ROOT, 'features', 'scheduling.slice', '_queries.ts');
      const content = fs.readFileSync(queriesPath, 'utf8');
      expect(content).toMatch(/@\/features\/projection\.bus/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [D26] Cross-cutting Authority — global-search.slice is the sole Cmd+K owner
  // Business slices MUST NOT implement their own cross-domain search or Cmd+K UI
  // ──────────────────────────────────────────────────────────────────────────
  describe('[D26] Cross-cutting Authority — global-search.slice owns Cmd+K', () => {
    /** Returns source files that define a CommandDialog component inside a business slice. */
    function findCommandDialogInSlices(sliceRoot: string): string[] {
      return collectSourceFiles(sliceRoot).filter((file) => {
        const content = fs.readFileSync(file, 'utf8');
        return /CommandDialog/.test(content);
      });
    }

    it('GlobalSearchDialog component lives in global-search.slice/_components/ [D26]', () => {
      const dialogPath = path.join(
        SRC_ROOT, 'features', 'global-search.slice', '_components', 'global-search-dialog.tsx'
      );
      expect(fs.existsSync(dialogPath)).toBe(true);
    });

    it('global-search.slice/index.ts exports GlobalSearch and GlobalSearchDialog [D26]', () => {
      const indexPath = path.join(SRC_ROOT, 'features', 'global-search.slice', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toMatch(/GlobalSearch/);
    });

    it('workspace.slice shell imports GlobalSearch from global-search.slice, not locally [D26]', () => {
      const headerPath = path.join(
        SRC_ROOT, 'features', 'workspace.slice', 'core', '_shell', 'header.tsx'
      );
      const content = fs.readFileSync(headerPath, 'utf8');
      // MUST import from global-search.slice (path alias @/ or relative)
      expect(content).toMatch(/from ['"](.*global-search\.slice)['"]/);
    });

    it('workspace.slice shell does NOT own its own global-search.tsx file [D26]', () => {
      const localSearchPath = path.join(
        SRC_ROOT, 'features', 'workspace.slice', 'core', '_shell', 'global-search.tsx'
      );
      // The file must have been removed from workspace.slice
      expect(fs.existsSync(localSearchPath)).toBe(false);
    });

    it('business slices do not implement their own CommandDialog (cross-domain search) [D26]', () => {
      const businessSliceDirs = [
        path.join(SRC_ROOT, 'features', 'workspace.slice'),
        path.join(SRC_ROOT, 'features', 'scheduling.slice'),
        path.join(SRC_ROOT, 'features', 'organization.slice'),
        path.join(SRC_ROOT, 'features', 'account.slice'),
      ].filter(fs.existsSync);

      const violations: string[] = [];
      for (const dir of businessSliceDirs) {
        const files = findCommandDialogInSlices(dir);
        // Allow CommandDialog only in files that import from global-search.slice
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          const isGlobalSearchImport = /global-search\.slice/.test(content);
          if (!isGlobalSearchImport) {
            violations.push(file);
          }
        }
      }
      if (violations.length > 0) {
        console.error('[D26 violation] Business slices implement own CommandDialog:\n', violations.join('\n'));
      }
      expect(violations).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // [D8] Shared-kernel purity — no async functions, Firestore calls, or side effects
  // CTA (centralized-tag) Firestore operations must live in semantic-graph.slice
  // ──────────────────────────────────────────────────────────────────────────
  describe('[D8] Shared-kernel purity — no Firestore calls or async functions', () => {
    /** Returns shared-kernel source files that import from @/shared/infra. */
    function findInfraImportsInSharedKernel(): string[] {
      const skRoot = path.join(SRC_ROOT, 'features', 'shared-kernel');
      return collectSourceFiles(skRoot).filter((file) => {
        const content = fs.readFileSync(file, 'utf8');
        return /from ['"]@\/shared\/infra/.test(content) || /from ['"]\.\.\/\.\.\/infra/.test(content);
      });
    }

    it('shared-kernel/centralized-tag/_aggregate.ts has no Firestore imports [D8]', () => {
      const aggPath = path.join(
        SRC_ROOT, 'features', 'shared-kernel', 'centralized-tag', '_aggregate.ts'
      );
      const content = fs.readFileSync(aggPath, 'utf8');
      expect(content).not.toMatch(/from ['"]@\/shared\/infra/);
      expect(content).not.toMatch(/firestore/);
    });

    it('shared-kernel/centralized-tag/_aggregate.ts has no async functions [D8]', () => {
      const aggPath = path.join(
        SRC_ROOT, 'features', 'shared-kernel', 'centralized-tag', '_aggregate.ts'
      );
      const content = fs.readFileSync(aggPath, 'utf8');
      expect(content).not.toMatch(/^export async function/m);
      expect(content).not.toMatch(/^async function/m);
    });

    it('shared-kernel/centralized-tag/_bus.ts publishTagEvent is synchronous [D8]', () => {
      const busPath = path.join(
        SRC_ROOT, 'features', 'shared-kernel', 'centralized-tag', '_bus.ts'
      );
      const content = fs.readFileSync(busPath, 'utf8');
      // Must not be `async function publishTagEvent`
      expect(content).not.toMatch(/async function publishTagEvent/);
      // Must still export publishTagEvent
      expect(content).toMatch(/export function publishTagEvent/);
    });

    it('no shared-kernel source file imports from @/shared/infra [D8]', () => {
      const violations = findInfraImportsInSharedKernel();
      if (violations.length > 0) {
        console.error('[D8 violation] shared-kernel files import from infra:\n', violations.join('\n'));
      }
      expect(violations).toHaveLength(0);
    });

    it('CTA Firestore operations live in semantic-graph.slice/centralized-tag/_actions.ts [D3+D8]', () => {
      const actionsPath = path.join(
        SRC_ROOT, 'features', 'semantic-graph.slice', 'centralized-tag', '_actions.ts'
      );
      expect(fs.existsSync(actionsPath)).toBe(true);
      const content = fs.readFileSync(actionsPath, 'utf8');
      expect(content).toMatch(/export async function createTag/);
      expect(content).toMatch(/export async function updateTag/);
      expect(content).toMatch(/export async function deprecateTag/);
      expect(content).toMatch(/export async function deleteTag/);
      expect(content).toMatch(/export async function getTag/);
    });

    it('semantic-graph.slice/index.ts re-exports CTA operations [D3+D8]', () => {
      const indexPath = path.join(SRC_ROOT, 'features', 'semantic-graph.slice', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toMatch(/createTag/);
      expect(content).toMatch(/updateTag/);
      expect(content).toMatch(/deprecateTag/);
      expect(content).toMatch(/deleteTag/);
      expect(content).toMatch(/getTag/);
    });
  });
});
