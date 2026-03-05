import type { ReactNode } from 'react';

type PortalLayoutProps = {
  children: ReactNode;
};

/**
 * PortalLayout — Root visual frame for all official portal pages.
 *
 * Responsibility: Provides a consistent outer wrapper (header, footer,
 * content area) for the public-facing portal experience.
 * Contains no business logic.
 */
export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">{children}</main>
    </div>
  );
}
