/**
 * Module: wiki/semantic-governance/editor/page
 * Purpose: Provide the VS8 semantic editor route shell.
 * Responsibilities: Host semantic-governance editor entry and describe command boundary.
 * Constraints: No direct graph writes; changes must flow through VS8 command APIs.
 */

export default function SemanticGovernanceEditorPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Semantic Governance Editor</h1>
      <p className="text-sm text-muted-foreground">
        Canonical route for editing semantic definitions. Wire this page to VS8 proposal and command
        handlers when editor components are ready.
      </p>
    </main>
  );
}
