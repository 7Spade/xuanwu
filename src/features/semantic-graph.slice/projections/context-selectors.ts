/**
 * Module: semantic-graph.slice/projections — [L7 VS8_PROJ] Context Selectors
 *
 * Read-only selectors for semantic context derivation [D21-7, T5].
 *
 * Derives contextual views of the graph for UI and business-logic consumers
 * without mutating any underlying stores.
 *
 * Architecture rules:
 *   [L7]  Pure, side-effect-free projections only.
 *   [D24] No direct Firebase import.
 *
 * @see docs/architecture/slices/semantic-graph.md — L7 VS8_PROJ
 */

// TODO [VS8_PROJ]: Implement context selectors.
//   Planned exports:
//     - getReachableNodes(fromSlug: string): readonly string[]
//     - getSemanticNeighbours(tagSlug: string, relationType?: RelationType): readonly string[]
