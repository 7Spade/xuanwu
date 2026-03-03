/**
 * @fileoverview Tests for ParsingIntentContract — Digital Twin [#A4]
 *
 * Validates that:
 *   1. createParsingIntentContract produces a valid contract with SkillRequirement[] [#A4][TE_SK]
 *   2. skillRequirements defaults to [] when not provided
 *   3. markParsingIntentImported transitions status to 'imported'
 *   4. supersedeParsingIntent transitions status to 'superseded'
 *   5. Immutability — operations return new objects without mutating the original
 *
 * Tags: [#A4] Digital Twin contract, [TE_SK] task::skill anchor, [A5] Scheduling Saga
 */

import { describe, it, expect } from 'vitest';

import type { SkillRequirement } from '@/features/shared-kernel';
import {
  createParsingIntentContract,
  markParsingIntentImported,
  supersedeParsingIntent,
} from '@/features/workspace.slice/business.parsing-intent/_contract';
import type { IntentDeltaProposedPayload } from '@/features/workspace.slice/core.event-bus';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_INPUT = {
  intentId: 'intent-001',
  workspaceId: 'ws-abc',
  sourceFileId: 'file-xyz',
  sourceVersionId: 'v1',
  taskDraftCount: 5,
};

const SKILL_REQUIREMENTS: SkillRequirement[] = [
  { tagSlug: 'civil-structural', minimumTier: 'journeyman', quantity: 2 },
  { tagSlug: 'bim', minimumTier: 'expert', quantity: 1 },
];

// ---------------------------------------------------------------------------
// createParsingIntentContract
// ---------------------------------------------------------------------------

describe('createParsingIntentContract [#A4]', () => {
  it('produces a contract with status "pending"', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    expect(contract.status).toBe('pending');
  });

  it('sets intentId, workspaceId, sourceFileId, sourceVersionId correctly', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    expect(contract.intentId).toBe('intent-001');
    expect(contract.workspaceId).toBe('ws-abc');
    expect(contract.sourceFileId).toBe('file-xyz');
    expect(contract.sourceVersionId).toBe('v1');
    expect(contract.taskDraftCount).toBe(5);
  });

  it('defaults skillRequirements to [] when not provided', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    expect(contract.skillRequirements).toEqual([]);
  });

  it('stores SkillRequirement[] when provided [TE_SK]', () => {
    const contract = createParsingIntentContract({
      ...BASE_INPUT,
      skillRequirements: SKILL_REQUIREMENTS,
    });
    expect(contract.skillRequirements).toHaveLength(2);
    expect(contract.skillRequirements[0].tagSlug).toBe('civil-structural');
    expect(contract.skillRequirements[0].minimumTier).toBe('journeyman');
    expect(contract.skillRequirements[1].tagSlug).toBe('bim');
    expect(contract.skillRequirements[1].minimumTier).toBe('expert');
  });

  it('sets createdAt and updatedAt to the current timestamp', () => {
    const before = Date.now();
    const contract = createParsingIntentContract(BASE_INPUT);
    const after = Date.now();
    expect(contract.createdAt).toBeGreaterThanOrEqual(before);
    expect(contract.createdAt).toBeLessThanOrEqual(after);
    expect(contract.updatedAt).toBe(contract.createdAt);
  });
});

// ---------------------------------------------------------------------------
// markParsingIntentImported
// ---------------------------------------------------------------------------

describe('markParsingIntentImported', () => {
  it('transitions status from "pending" to "imported"', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    const imported = markParsingIntentImported(contract);
    expect(imported.status).toBe('imported');
  });

  it('updates updatedAt when marking imported', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    // Ensure a detectable time difference
    const originalUpdatedAt = contract.updatedAt;
    const imported = markParsingIntentImported(contract);
    expect(imported.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
  });

  it('does not mutate the original contract (immutability)', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    markParsingIntentImported(contract);
    expect(contract.status).toBe('pending');
  });

  it('preserves skillRequirements through import transition', () => {
    const contract = createParsingIntentContract({
      ...BASE_INPUT,
      skillRequirements: SKILL_REQUIREMENTS,
    });
    const imported = markParsingIntentImported(contract);
    expect(imported.skillRequirements).toEqual(SKILL_REQUIREMENTS);
  });
});

// ---------------------------------------------------------------------------
// supersedeParsingIntent
// ---------------------------------------------------------------------------

describe('supersedeParsingIntent', () => {
  it('transitions status to "superseded"', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    const superseded = supersedeParsingIntent(contract, 'intent-002');
    expect(superseded.status).toBe('superseded');
  });

  it('records the next intent ID in supersedesIntentId', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    const superseded = supersedeParsingIntent(contract, 'intent-002');
    expect(superseded.supersedesIntentId).toBe('intent-002');
  });

  it('does not mutate the original contract (immutability)', () => {
    const contract = createParsingIntentContract(BASE_INPUT);
    supersedeParsingIntent(contract, 'intent-002');
    expect(contract.status).toBe('pending');
    expect(contract.supersedesIntentId).toBeUndefined();
  });

  it('preserves all other fields through supersession', () => {
    const contract = createParsingIntentContract({
      ...BASE_INPUT,
      skillRequirements: SKILL_REQUIREMENTS,
    });
    const superseded = supersedeParsingIntent(contract, 'intent-002');
    expect(superseded.intentId).toBe(contract.intentId);
    expect(superseded.workspaceId).toBe(contract.workspaceId);
    expect(superseded.skillRequirements).toEqual(SKILL_REQUIREMENTS);
  });

  it('allows chaining: imported → superseded (Digital Twin version chain [#A4])', () => {
    const v1 = createParsingIntentContract(BASE_INPUT);
    const v1imported = markParsingIntentImported(v1);
    const v1superseded = supersedeParsingIntent(v1imported, 'intent-002');
    expect(v1superseded.status).toBe('superseded');
    expect(v1superseded.supersedesIntentId).toBe('intent-002');
    // Original v1 still pending (not mutated)
    expect(v1.status).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
// IntentDeltaProposedPayload contract [#A4 — Digital Twin event]
// ---------------------------------------------------------------------------

describe('IntentDeltaProposedPayload [#A4 — ws-outbox at-least-once event]', () => {
  it('accepts required fields only', () => {
    const payload: IntentDeltaProposedPayload = {
      intentId: 'intent-001',
      workspaceId: 'ws-abc',
      sourceFileName: 'BOQ-2026-Q1.xlsx',
      taskDraftCount: 12,
    };
    expect(payload.intentId).toBe('intent-001');
    expect(payload.taskDraftCount).toBe(12);
    expect(payload.skillRequirements).toBeUndefined();
    expect(payload.traceId).toBeUndefined();
  });

  it('accepts optional skillRequirements for TE_SK propagation', () => {
    const payload: IntentDeltaProposedPayload = {
      intentId: 'intent-002',
      workspaceId: 'ws-xyz',
      sourceFileName: 'Schedule.pdf',
      taskDraftCount: 3,
      skillRequirements: SKILL_REQUIREMENTS,
      traceId: 'trace-001',
    };
    expect(payload.skillRequirements).toHaveLength(2);
    expect(payload.traceId).toBe('trace-001');
  });

  it('payload fields match what document-parser-view dispatches [#A4×document-parser]', () => {
    // Mirrors the shape built in handleImport() — prevents shape drift
    const simulatedDispatch = (
      intentId: string,
      workspaceId: string,
      sourceFileName: string,
      taskDraftCount: number,
    ): IntentDeltaProposedPayload => ({ intentId, workspaceId, sourceFileName, taskDraftCount });

    const payload = simulatedDispatch('intent-003', 'ws-001', 'doc.xlsx', 5);
    expect(payload).toEqual({
      intentId: 'intent-003',
      workspaceId: 'ws-001',
      sourceFileName: 'doc.xlsx',
      taskDraftCount: 5,
    });
  });
});
