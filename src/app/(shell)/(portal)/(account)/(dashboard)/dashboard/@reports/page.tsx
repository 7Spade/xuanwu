/**
 * @reports — Dashboard root slot: account audit timeline.
 * Only rendered at /dashboard (the root segment). Sub-routes receive
 * `default.tsx` (null) so the slot gracefully disappears.
 *
 * [D6] Server Component wrapper; AccountAuditComponent is a client island.
 */
import { AccountAuditComponent } from "@/features/workspace.slice";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <AccountAuditComponent />
    </div>
  );
}
