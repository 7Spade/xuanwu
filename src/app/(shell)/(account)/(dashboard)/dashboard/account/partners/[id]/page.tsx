import { PartnerDetailView } from "@/features/account.slice"

/**
 * PartnerTeamDetailPage - Manages recruitment and identity governance within a specific partner team.
 * REFACTORED: Now consumes invites from the global AppContext.
 */
export default function PartnerTeamDetailPage() {
  return <PartnerDetailView />
}
