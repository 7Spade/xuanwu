import { AccountCapabilityTabs, AccountScheduleSection } from "@/features/workforce-scheduling.slice";

/**
 * Module: page.tsx
 * Purpose: Account schedule capability route.
 * Responsibilities: mount capability tabs and schedule section.
 * Constraints: deterministic logic, respect module boundaries
 */

export default function AccountSchedulePage() {
  return (
    <div>
      <AccountCapabilityTabs />
      <AccountScheduleSection />
    </div>
  );
}
