/**
 * Module: index.ts
 * Purpose: expose centralized-tag slice surface
 * Responsibilities: publish event bus API and shared contract types
 * Constraints: deterministic logic, respect module boundaries
 */

export type {
  CentralizedTagEntry,
  CentralizedTagDeleteRule,
  CentralizedTagDeleteRule as TagDeleteRule,
} from '@/shared-kernel';
export { onTagEvent, publishTagEvent } from './_bus';
export type {
  TagLifecycleEventPayloadMap,
  TagLifecycleEventKey,
  TagCreatedPayload,
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from './_events';
