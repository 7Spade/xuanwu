
/**
 * Workspaces Layout
 *
 * Responsibility: Business layout for authenticated workspace pages.
 * Auth guard and SidebarProvider live in (shell)/layout.tsx.
 * AccountProvider lives in the parent (account)/layout.tsx.
 *
 * Parallel route structure:
 *   @header  →  Header (SidebarTrigger + Breadcrumb, inside SidebarInset)
 *   @modal   →  route-specific dialog/overlay interceptions
 *
 * [D6] Server Component — no hooks or browser APIs; client children handle
 * their own interactivity. "use client" is not required here.
 */

import type { ReactNode } from "react";

import { ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shared/shadcn-ui/sidebar";

type WorkspacesLayoutProps = {
  children: ReactNode;
  /** @header parallel route slot — Header with SidebarTrigger + Breadcrumb */
  header: ReactNode;
  /** @modal parallel route slot — route-specific dialog/overlay surfaces */
  modal: ReactNode;
};

export default function WorkspacesLayout({ children, header, modal }: WorkspacesLayoutProps) {
  return (
    <SidebarInset>
      {header}
      <ThemeAdapter>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </ThemeAdapter>
      {modal}
    </SidebarInset>
  );
}
