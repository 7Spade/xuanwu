'use client';

import { useState } from 'react';

import type { PortalState } from '@/features/portal.slice/_types';

/**
 * usePortalState — Presentation bridge hook for portal domain state.
 *
 * Exposes the portal's runtime state to presentation layer components.
 * All domain mutations must go through core/_actions.ts [D3].
 */
export function usePortalState(): PortalState {
  // Minimal prototype — setter intentionally omitted until real state is wired
  const [isInitializing] = useState(false);

  return { isInitializing };
}
