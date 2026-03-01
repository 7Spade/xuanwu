/**
 * scheduling-saga — DEPRECATED shim
 *
 * All VS6 scheduling code has been consolidated into scheduling.slice.
 * This file re-exports for backward compatibility.
 * @deprecated Import from '@/features/scheduling.slice' directly.
 */
export { startSchedulingSaga, getSagaState } from '@/features/scheduling.slice';
export type { SagaState, SagaStep, SagaStatus } from '@/features/scheduling.slice';
