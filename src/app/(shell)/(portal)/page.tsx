
/**
 * Module: portal/page
 * Purpose: Root route bridge to the public landing entry.
 * Responsibilities: Delegate `/` rendering to landing page implementation.
 * Constraints: deterministic logic, respect module boundaries
 */
export { default } from "../(public)/landing/page";
