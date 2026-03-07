/**
 * Module: wiki/page
 * Purpose: VS8 wiki landing route.
 * Responsibilities: Present governance entry points and guide users to semantic wiki tools.
 * Constraints: Keep page read-only; mutation flows must go through command gateways.
 */

import Link from "next/link";

const WIKI_ROUTES = [
  {
    href: "/wiki/semantic-governance/editor",
    title: "Semantic Editor",
    description: "Edit canonical semantic definitions through the governance workflow.",
  },
  {
    href: "/wiki/semantic-governance/proposal-stream",
    title: "Proposal Stream",
    description: "Review pending relationship proposals and consensus status.",
  },
  {
    href: "/wiki/semantic-governance/relationship-visualizer",
    title: "Relationship Visualizer",
    description: "Inspect graph relationships in a read-oriented semantic view.",
  },
] as const;

export default function WikiLandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">VS8 Wiki</h1>
        <p className="text-sm text-muted-foreground">
          Semantic governance workspace for D21 policy flows. Choose a panel to continue.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WIKI_ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
          >
            <p className="text-base font-medium">{route.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{route.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
