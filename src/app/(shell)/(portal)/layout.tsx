/**
 * Module: layout.tsx
 * Purpose: define portal route-group layout boundary
 * Responsibilities: wrap portal children without changing behavior
 * Constraints: deterministic logic, respect module boundaries
 */

import type { ReactNode } from "react";

type PortalLayoutProps = {
  children: ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  return children;
}
