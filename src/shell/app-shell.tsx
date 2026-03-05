'use client';

import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

/**
 * AppShell — Authenticated application shell root.
 *
 * Responsibility: Assembles the full authenticated frame by composing
 * portal layouts, feature-provided sidebar/header chrome, and route
 * content (children). Acts as the single integration point between
 * the portal layer and authenticated feature slices.
 *
 * Does NOT carry business logic.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
