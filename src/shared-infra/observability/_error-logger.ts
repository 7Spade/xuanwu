/**
 * Module: _error-logger
 * Purpose: Provide structured domain error logging implementation.
 * Responsibilities: emit domain error entries to the configured runtime sink.
 * Constraints: this module is side-effectful and must remain outside shared-kernel.
 */

import type { DomainErrorEntry, IErrorLogger } from '@/shared-kernel/observability';

export function logDomainError(entry: DomainErrorEntry): void {
  console.error('[DOMAIN_ERROR_LOG]', JSON.stringify(entry));
}

/** Default error logger implementation for app runtime wiring. */
export const errorLogger: IErrorLogger = {
  logDomainError,
};
