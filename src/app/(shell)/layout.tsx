
/**
 * Shell Layout — Global UI Container
 *
 * Responsibility: Outer visual frame shared by all shell routes (both public and portal).
 * - SidebarProvider: owns global sidebar open/close state (portal only)
 * - Slot composition (portal only):
 *     @sidebar  → DashboardSidebar (peer element for CSS transitions)
 *     @modal    → global overlay surface (null by default)
 *     children  → route content
 * - [S6] useTokenRefreshListener: fulfils Frontend Party 3 of Claims refresh handshake
 * - Auth guard is intentionally NOT here; it lives in (portal)/layout.tsx so that
 *   public routes (/login, /reset-password) remain accessible to unauthenticated users.
 *
 * Does NOT carry business logic.
 */

"use client";

import { Fragment, type ReactNode } from "react";

import { AccountProvider } from "@/app-runtime/providers/account-provider";
import { useAuth } from "@/app-runtime/providers/auth-provider";
import { useTokenRefreshListener } from "@/features/identity.slice";
import { SidebarProvider } from "@/shadcn-ui/sidebar";

type ShellLayoutProps = {
  children: ReactNode;
  /** @sidebar slot — DashboardSidebar (used by portal routes) */
  sidebar: ReactNode;
  /** @modal slot — global overlay (null by default) */
  modal: ReactNode;
};

export default function ShellLayout({ children, sidebar, modal }: ShellLayoutProps) {
  const { state } = useAuth();
  const { user } = state;

  // [S6] Frontend Party 3 — force-refresh Firebase token on TOKEN_REFRESH_SIGNAL
  useTokenRefreshListener(user?.id ?? null);

  // For unauthenticated users (public routes like /login), skip the full shell
  // to avoid rendering sidebar, but still provide AccountContext for shared
  // header/hooks that depend on useAccount during route prerender.
  if (!user) {
    return (
      <SidebarProvider>
        <AccountProvider>{children}</AccountProvider>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AccountProvider>
        <Fragment key="sidebar">{sidebar}</Fragment>
        <Fragment key="main">{children}</Fragment>
        <Fragment key="modal">{modal}</Fragment>
      </AccountProvider>
    </SidebarProvider>
  );
}
