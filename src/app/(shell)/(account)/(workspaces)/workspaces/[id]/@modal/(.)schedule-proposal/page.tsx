// Intercepting route: renders ProposalDialog in the @modal slot when navigating
// to /workspaces/[id]/schedule-proposal from within the workspace layout.
"use client"

import { ScheduleProposalContent } from "@/features/scheduling.slice"

export default function ScheduleProposalModalPage() {
  return <ScheduleProposalContent />
}
