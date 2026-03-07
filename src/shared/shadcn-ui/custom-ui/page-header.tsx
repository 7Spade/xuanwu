"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/shadcn-ui/utils/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children?: ReactNode;
  size?: "default" | "compact";
  className?: string;
  actionsClassName?: string;
}

/**
 * PageHeader — shared page-level heading component.
 * Used across all dashboard views for a consistent title/description/action layout.
 */
export function PageHeader({
  title,
  description,
  badge,
  children,
  size = "default",
  className,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end", className)}>
      <div className="space-y-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1
          className={cn(
            "font-headline font-bold tracking-tight",
            size === "compact" ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}
        >
          {title}
        </h1>
        {description && (
          <p className={cn("text-muted-foreground", size === "compact" ? "text-sm" : "text-base")}>
            {description}
          </p>
        )}
      </div>
      <div className={cn("flex flex-wrap items-center gap-2", actionsClassName)}>{children}</div>
    </div>
  );
}
