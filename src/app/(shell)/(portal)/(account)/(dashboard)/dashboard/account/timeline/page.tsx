import {
  AccountTimelineCapabilityTabs,
  AccountTimelineSection,
} from "@/features/timelineing.slice";

/**
 * Module: page.tsx
 * Purpose: Account timeline capability route.
 * Responsibilities: mount capability tabs and timeline section.
 * Constraints: deterministic logic, respect module boundaries
 */

export default function AccountTimelinePage() {
  return (
    <div>
      <AccountTimelineCapabilityTabs />
      <AccountTimelineSection />
    </div>
  );
}
