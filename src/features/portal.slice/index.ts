/**
 * portal.slice — Public API
 *
 * Portal feature domain slice.
 * Owns all business logic, state, actions, and queries for the portal
 * and application shell layers.
 *
 * Architecture:
 *   [D3]   All mutations via core/_actions.ts.
 *   [D7]   External consumers import only from this file.
 *   [D24]  No firebase/* imports anywhere in this slice.
 *   [D19]  Domain types owned in _types.ts.
 *
 * External consumers import from '@/features/portal.slice'.
 */

// =================================================================
// Domain Types
// =================================================================
export type { PortalState } from './_types';

// =================================================================
// Core Hooks (Presentation Bridge)
// =================================================================
export { usePortalState } from './core/_hooks/use-portal-state';
