/**
 * Module: architecture-ssot-compliance.test
 * Purpose: Enforce ProjectionBus architecture SSOT invariants
 * Responsibilities: validate S2 guard patterns and D24 Firebase boundary
 * Constraints: deterministic logic, respect module boundaries
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(process.cwd(), 'src');
const FEATURES_ROOT = path.join(SRC_ROOT, 'features');
const PROJECTION_BUS_ROOT = path.join(FEATURES_ROOT, 'projection.bus');

const APPEND_ONLY_S2_ALLOWLIST = new Set([
  'account-audit/_projector.ts',
  'global-audit-view/_projector.ts',
  '_funnel.shared.ts',
]);

function normalizePath(pathValue: string): string {
  return pathValue.replace(/\\/g, '/');
}

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    const isTsFile = entry.name.endsWith('.ts') || entry.name.endsWith('.tsx');
    const isTestFile = entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx');
    const isTypeDef = entry.name.endsWith('.d.ts');

    if (isTsFile && !isTestFile && !isTypeDef) {
      files.push(fullPath);
    }
  }

  return files;
}

function findDirectFirebaseImports(rootDir: string): string[] {
  const importPattern = /^\s*import\s+.+\s+from\s+['"]firebase\/(app|auth|firestore|storage|messaging)['"];?\s*$/m;

  return collectSourceFiles(rootDir).filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return importPattern.test(content);
  });
}

function projectionWritesWithoutS2Guard(): string[] {
  const writePattern = /\b(setDocument|updateDocument|setDoc|updateDoc|addDocument|addDoc|writeBatch|runTransaction)\s*\(/;
  const guardPattern = /\b(versionGuardAllows|applyVersionGuard)\s*\(/;

  return collectSourceFiles(PROJECTION_BUS_ROOT)
    .map((filePath) => {
      const relPath = normalizePath(path.relative(PROJECTION_BUS_ROOT, filePath));
      return { filePath, relPath, content: fs.readFileSync(filePath, 'utf8') };
    })
    .filter(({ content }) => writePattern.test(content))
    .filter(({ relPath, content }) => {
      if (guardPattern.test(content)) {
        return false;
      }
      if (!APPEND_ONLY_S2_ALLOWLIST.has(relPath)) {
        return true;
      }
      return !content.includes('[S2]');
    })
    .map(({ relPath }) => relPath);
}

describe('[SSOT] ProjectionBus architecture compliance', () => {
  it('[D24] feature slices do not import firebase/* directly', () => {
    const violations = findDirectFirebaseImports(FEATURES_ROOT)
      .map((filePath) => normalizePath(path.relative(process.cwd(), filePath)));
    expect(violations).toEqual([]);
  });

  it('[S2] projection writes use version guard or documented append-only path', () => {
    const violations = projectionWritesWithoutS2Guard();
    expect(violations).toEqual([]);
  });
});
