/**
 * Module: semantic-graph.slice/centralized-embeddings — Vector Store [D21-D]
 *
 * In-process vector registry for tag semantic embeddings.
 *
 * D21-D mandates that every tag node's embedding vector is tracked for
 * consistency — the same tag must yield the same vector within a session,
 * and cosine similarity between any two tags must be computable on demand.
 *
 * This module is the single source of truth for per-session embedding
 * retrieval.  Persistence to an external vector database is the
 * responsibility of the infra adapter layer [D24].
 *
 * Dependency rule: ZERO infrastructure imports (no Firebase, no React, no I/O).
 */

import type { TagSlugRef } from '@/shared-kernel';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VectorStoreEntry {
  readonly slug: TagSlugRef;
  readonly vector: readonly number[];
  readonly storedAt: string;
}

// ─── VectorStore ──────────────────────────────────────────────────────────────

/**
 * In-memory vector store for tag semantic embeddings [D21-D].
 *
 * Thread-safety note: JavaScript is single-threaded; no locking is required.
 */
export class VectorStore {
  private readonly _store = new Map<string, VectorStoreEntry>();

  // ─── Write ──────────────────────────────────────────────────────────────────

  /**
   * Persist the embedding vector for a tag slug.
   * Overwrites any previous vector for the same slug.
   *
   * @param slug   - The tag slug this vector belongs to.
   * @param vector - Dense float array (dimension must be > 0).
   * @throws {Error} if vector is empty.
   */
  storeEmbedding(slug: TagSlugRef, vector: readonly number[]): void {
    if (vector.length === 0) {
      throw new Error(`[D21-D] Cannot store an empty embedding vector for slug: ${slug as string}`);
    }
    this._store.set(slug as string, {
      slug,
      vector,
      storedAt: new Date().toISOString(),
    });
  }

  // ─── Read ───────────────────────────────────────────────────────────────────

  /**
   * Retrieve the embedding vector for a tag, or null if not yet stored.
   *
   * @param slug - The tag slug to look up.
   */
  getEmbedding(slug: TagSlugRef): readonly number[] | null {
    return this._store.get(slug as string)?.vector ?? null;
  }

  /**
   * Return true if an embedding exists for the given slug.
   *
   * @param slug - The tag slug to check.
   */
  hasEmbedding(slug: TagSlugRef): boolean {
    return this._store.has(slug as string);
  }

  // ─── Similarity ─────────────────────────────────────────────────────────────

  /**
   * Compute the cosine similarity between the vectors of two tag slugs.
   *
   * @returns A value in [-1, 1]; returns 0 if either vector is missing or zero-norm.
   */
  computeCosineSimilarity(a: TagSlugRef, b: TagSlugRef): number {
    const vecA = this.getEmbedding(a);
    const vecB = this.getEmbedding(b);
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i]! * vecB[i]!;
      normA += vecA[i]! * vecA[i]!;
      normB += vecB[i]! * vecB[i]!;
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dot / denominator;
  }

  // ─── Bulk ───────────────────────────────────────────────────────────────────

  /**
   * Return all stored entries (for projection or serialisation).
   */
  getAll(): readonly VectorStoreEntry[] {
    return Array.from(this._store.values());
  }

  /**
   * Remove the embedding for a slug (e.g. on tag deletion).
   *
   * @param slug - The tag slug to evict.
   */
  deleteEmbedding(slug: TagSlugRef): void {
    this._store.delete(slug as string);
  }

  /** Clear all stored embeddings (used in tests). */
  clear(): void {
    this._store.clear();
  }
}

// ─── Module-level singleton ───────────────────────────────────────────────────

/** Default module-level VectorStore instance. Import and use directly. */
export const vectorStore = new VectorStore();
