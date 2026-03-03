import { describe, it, expect } from 'vitest';

import { SUBCOLLECTIONS } from './collection-paths';

describe('SUBCOLLECTIONS path contracts', () => {
  it('uses camelCase ParsingIntent path to keep repositories and queries consistent', () => {
    expect(SUBCOLLECTIONS.parsingIntents).toBe('parsingIntents');
  });

  it('defines parsingImports ledger path for intent materialization idempotency', () => {
    expect(SUBCOLLECTIONS.parsingImports).toBe('parsingImports');
  });
});
