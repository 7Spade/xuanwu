/**
 * @analytics — Dashboard root slot: dimension stat cards.
 * Only rendered at /dashboard (the root segment). Sub-routes receive
 * `default.tsx` (null) so the slot gracefully disappears.
 *
 * [D6] Server Component wrapper; StatCards is a client island.
 */
import { StatCards } from "@/features/workspace.slice";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <StatCards />
    </div>
  );
}
