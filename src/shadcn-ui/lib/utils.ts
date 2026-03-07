/**
 * Module: lib/utils
 * Purpose: Path-alias bridge for @/shadcn-ui/lib/utils → utils/utils
 * Responsibilities: Re-export cn and helpers so legacy/generated imports resolve correctly
 * Constraints: deterministic logic, respect module boundaries
 */
export { cn, firestoreTimestampToISO, hexToHsl } from "@/shadcn-ui/utils/utils";
