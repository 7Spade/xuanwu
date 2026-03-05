/**
 * Module: location-action.tsx
 * Purpose: render location action button in WBS task row
 * Responsibilities: provide clickable location icon action
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { MapPin } from 'lucide-react';

import { Button } from '@/shared/shadcn-ui/button';

import { type TaskWithChildren } from '../_types';

type LocationActionProps = {
  node: TaskWithChildren;
  onOpenLocation: (node: TaskWithChildren) => void;
};

export function LocationAction({ node, onOpenLocation }: LocationActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 rounded-md text-primary"
      onClick={() => onOpenLocation(node)}
      title="View location details"
      aria-label="View location details"
    >
      <MapPin className="size-3 shrink-0" />
    </Button>
  );
}
