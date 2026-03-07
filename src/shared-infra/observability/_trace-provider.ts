/**
 * Module: _trace-provider
 * Purpose: Provide observability trace ID generation for infrastructure/runtime layers.
 * Responsibilities: generate trace identifiers and build trace context payloads.
 * Constraints: deterministic module boundary, implementation may use runtime clocks/randomness.
 */

import type { ITraceProvider, TraceContext } from '@/shared-kernel/observability';

/**
 * Generates a unique correlation/trace identifier for a command or event chain.
 * Format: "<timestamp>-<random>".
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a TraceContext for a new command or event chain.
 */
export function createTraceContext(source?: string): TraceContext {
  return {
    traceId: generateTraceId(),
    initiatedAt: new Date().toISOString(),
    source,
  };
}

/** Default trace provider implementation for app runtime wiring. */
export const traceProvider: ITraceProvider = {
  generateTraceId,
  createTraceContext,
};
