/**
 * Module: wiki/semantic-governance/relationship-visualizer/page
 * Purpose: Provide the VS8 relationship visualizer route shell.
 * Responsibilities: Offer a graph-view entry point for semantic relationship inspection.
 * Constraints: Read from projection/query outputs; do not read adjacency internals directly.
 */

import { RelationshipVisualizer } from "../../_components/relationship-visualizer";

export default function SemanticGovernanceRelationshipVisualizerPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">關係視覺化 (Relationship Visualizer)</h1>
        <p className="text-sm text-muted-foreground">
          僅在此頁面載入 <code>vis-network</code>，避免首頁每次都渲染造成效能負擔。
        </p>
      </header>

      <RelationshipVisualizer />
    </main>
  );
}
