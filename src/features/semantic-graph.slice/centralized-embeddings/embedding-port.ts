/**
 * semantic-graph.slice/centralized-embeddings — IEmbeddingPort [D24][D26]
 *
 * Port interface for semantic vector generation.
 * MUST NOT import any AI SDK or firebase/* directly — this is a pure
 * dependency-inversion port that lives in SK_PORTS per D24/D25.
 *
 * Architecture:
 *   IEmbeddingPort (this file) ← registered in SK_PORTS
 *   ↑ consumed by centralized-embeddings/semantic-embedder.ts
 *   ↓ implemented by infra adapter (e.g. VertexAI, OpenAI) in src/shared/infra/
 *
 * The produced TagEmbedding is projected to projection.tag-snapshot for use
 * by Global Search (VS8) in cross-domain retrieval [D26].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '@/features/shared-kernel';

import type { TagEmbedding } from '../centralized-types';

// ─── Port interface ───────────────────────────────────────────────────────────

/**
 * IEmbeddingPort — Dependency-inversion port for AI-backed embedding generation.
 *
 * [D24] Feature slices MUST depend on this interface, never on AI SDK directly.
 * [D25] Concrete adapter registered in composition root (src/shared/infra/embeddings/).
 */
export interface IEmbeddingPort {
  /**
   * Generate a semantic vector for a single text string.
   *
   * @param text - The text to embed (typically `tag::{category}/{slug} label`).
   * @returns A dense float vector (dimension depends on backing model).
   */
  embed(text: string): Promise<readonly number[]>;

  /**
   * Batch-generate vectors for multiple texts.
   * Prefer this over looping embed() to reduce round trips.
   */
  embedBatch(texts: readonly string[]): Promise<readonly (readonly number[])[]>;
}

// ─── No-op stub for use in tests / before adapter registration ───────────────

/**
 * A zero-vector stub that satisfies IEmbeddingPort without calling any external service.
 * Registered as the default port if no adapter is injected.
 *
 * Consumers MUST replace this via injectEmbeddingPort() before production use.
 */
export const NOOP_EMBEDDING_PORT: IEmbeddingPort = {
  embed: async (_text: string) => [],
  embedBatch: async (texts: readonly string[]) => texts.map(() => []),
};

// ─── Port registry (simple composition-root injection) ───────────────────────

let _embeddingPort: IEmbeddingPort = NOOP_EMBEDDING_PORT;

/**
 * Inject the concrete embedding adapter.
 * Called once from the composition root during application bootstrap.
 */
export function injectEmbeddingPort(port: IEmbeddingPort): void {
  _embeddingPort = port;
}

/** Read the currently registered port (primarily for testing). */
export function getEmbeddingPort(): IEmbeddingPort {
  return _embeddingPort;
}

// ─── Embedder helper ─────────────────────────────────────────────────────────

/**
 * Build a TagEmbedding for the given tag by calling the registered IEmbeddingPort.
 *
 * The embedding text follows the D21 semantic URI convention:
 *   `tag::{category}/{slug} {label}`
 *
 * Result is ready to be projected to projection.tag-snapshot for Global Search.
 */
export async function buildTagEmbedding(
  tagSlug: TagSlugRef,
  category: string,
  label: string,
  model = 'default'
): Promise<TagEmbedding> {
  const text = `tag::${category}/${tagSlug} ${label}`;
  const vector = await _embeddingPort.embed(text);
  return {
    tagSlug,
    vector,
    model,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Batch-build TagEmbeddings for multiple tags.
 * Projects all results to projection.tag-snapshot format.
 */
export async function buildTagEmbeddingsBatch(
  tags: ReadonlyArray<{ tagSlug: TagSlugRef; category: string; label: string }>,
  model = 'default'
): Promise<readonly TagEmbedding[]> {
  const texts = tags.map((t) => `tag::${t.category}/${t.tagSlug} ${t.label}`);
  const vectors = await _embeddingPort.embedBatch(texts);
  const now = new Date().toISOString();
  return tags.map((t, i) => ({
    tagSlug: t.tagSlug,
    vector: vectors[i] ?? [],
    model,
    generatedAt: now,
  }));
}
