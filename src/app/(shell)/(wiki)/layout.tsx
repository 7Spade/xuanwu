/**
 * Module: app/(shell)/(wiki)/layout
 * Purpose: Provide dashboard-consistent shell chrome for wiki routes.
 * Responsibilities: Render shared Header, SidebarInset container, and themed wiki content area.
 * Constraints: keep business logic inside feature slices; layout only composes shell surfaces.
 */

import type { ReactNode } from "react";

import { Header, ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shadcn-ui/sidebar";

type WikiLayoutProps = {
  children: ReactNode;
};

export default function WikiLayout({ children }: WikiLayoutProps) {
  return (
    <SidebarInset>
      <Header />
      <ThemeAdapter>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </ThemeAdapter>
    </SidebarInset>
  );
}
