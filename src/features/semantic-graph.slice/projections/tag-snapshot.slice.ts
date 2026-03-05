/**
 * Module: semantic-graph.slice/projections — [L7 VS8_PROJ] Tag Snapshot
 *
 * The sole legal read exit for tag entity data [D21-7, T5].
 *
 * Consumers (VS4, VS5, VS6, global-search) must read tag state exclusively
 * through this snapshot; they must not query centralized-tag/ or centralized-edges/
 * directly [D26].
 *
 * Architecture rules:
 *   [L7]  Read-only projection layer — no writes, no side effects.
 *   [T5]  tag-snapshot.slice is the sole authorised read exit for tag data.
 *   [D24] No direct Firebase import.
 *
 * @see docs/architecture/slices/semantic-graph.md — L7 VS8_PROJ
 */

// TODO [VS8_PROJ]: Implement tag-snapshot read model.
//   Planned exports:
//     - TagSnapshot type
//     - getTagSnapshot(tagSlug: string): TagSnapshot | undefined
//     - subscribeTagSnapshot(tagSlug: string, cb: (s: TagSnapshot) => void): Unsubscribe

export type TagSnapshot = {
  /** Placeholder — full schema TBD */
  tagSlug: string;
};
