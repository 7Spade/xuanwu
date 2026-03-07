// Intercepting route: renders ProposalDialog in the @modal slot when navigating
// to /workspaces/[id]/schedule-proposal from within the workspace layout.
// [D6] Server Component — ScheduleProposalContent is already "use client"; no
// directive needed here.

import { ScheduleProposalContent } from "@/features/workforce-scheduling.slice"

export default function ScheduleProposalModalPage() {
  return <ScheduleProposalContent />
}
