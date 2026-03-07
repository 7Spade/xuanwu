
/**
 * Dashboard Layout
 *
 * Responsibility: Business layout for authenticated dashboard pages.
 * Auth guard and SidebarProvider live in (shell)/layout.tsx.
 * AccountProvider lives in the parent (account)/layout.tsx.
 *
 * Parallel route structure:
 *   @header    → Header (SidebarTrigger + Breadcrumb, inside SidebarInset)
 *   @modal     → route-specific dialog/overlay interceptions
 *   @analytics → Dimension stat cards (StatCards) — dashboard root only;
 *                default.tsx returns null on sub-routes so the slot is
 *                invisible during navigation to /dashboard/account/…
 *   @reports   → Account audit timeline — dashboard root only;
 *                default.tsx returns null on sub-routes
 *
 * Each slot has its own loading.tsx (Suspense boundary) and default.tsx
 * (prevents 404 on hard navigation to sub-routes).
 *
 * [D6] Server Component — no hooks or browser APIs; client children handle
 * their own interactivity. "use client" is not required here.
 */

import type { ReactNode } from "react";

import { ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shadcn-ui/sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  /** @header parallel route slot — Header with SidebarTrigger + Breadcrumb */
  header: ReactNode;
  /** @modal parallel route slot — route-specific dialog/overlay surfaces */
  modal: ReactNode;
  /** @analytics parallel route slot — StatCards (dashboard root only, null on sub-routes) */
  analytics: ReactNode;
  /** @reports parallel route slot — AccountAuditComponent (dashboard root only, null on sub-routes) */
  reports: ReactNode;
};

export default function DashboardLayout({ children, header, modal, analytics, reports }: DashboardLayoutProps) {
  return (
    <SidebarInset>
      {header}
      <ThemeAdapter>
        <main className="flex-1 space-y-8 overflow-y-auto p-6">
          {analytics}
          {children}
          {reports}
        </main>
      </ThemeAdapter>
      {modal}
    </SidebarInset>
  );
}
