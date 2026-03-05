/**
 * portal.slice — Domain Type Definitions [D19/D20]
 *
 * All portal-specific domain types are owned here.
 * External consumers import via portal.slice/index.ts [D7].
 */

/** Represents the runtime state of the portal layer. */
export type PortalState = {
  /** Whether the portal is in its initial loading phase. */
  isInitializing: boolean;
};
