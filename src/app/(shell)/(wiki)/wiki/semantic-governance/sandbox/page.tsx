/**
 * Module: wiki/semantic-governance/sandbox/page
 * Purpose: Provide the VS8 semantic sandbox route shell.
 * Responsibilities: Host experimental semantic simulations and isolated policy experiments.
 * Constraints: Sandbox actions must remain isolated from production projections until approved.
 */

export default function SemanticGovernanceSandboxPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight">語義沙盒 (Sandbox)</h1>
      <p className="text-sm text-muted-foreground">
        這個區域保留給語義實驗與提案模擬，不承載正式關係視覺化。關係圖請使用「關係視覺化」頁面。
      </p>
    </main>
  );
}
