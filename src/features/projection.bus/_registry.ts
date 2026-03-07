/**
 * projection.bus ??_registry.ts
 *
 * Event stream offset + read model version table.
 *
 * Per 00-LogicOverview.md:
 * - EVENT_FUNNEL_INPUT ?í|?¥Êñ∞‰∫ã‰ª∂‰∏≤Ê??èÁßª?è| PROJECTION_VERSION
 * - PROJECTION_VERSION ?í|?ê‰? read-model Â∞çÊ??àÊú¨| READ_MODEL_REGISTRY
 */

import {
  getProjectionVersion as getProjectionVersionRepo,
  upsertProjectionVersion as upsertProjectionVersionRepo,
  type ProjectionVersionRecord,
} from '@/shared-infra/frontend-firebase/firestore/firestore.facade';

export type { ProjectionVersionRecord };

/**
 * Retrieves the current event offset and version for a named projection.
 * Returns null if the projection has never been updated.
 */
export async function getProjectionVersion(
  projectionName: string
): Promise<ProjectionVersionRecord | null> {
  return getProjectionVersionRepo(projectionName);
}

/**
 * Updates the event offset and read model version for a named projection.
 * Called by EVENT_FUNNEL_INPUT after processing each event.
 */
export async function upsertProjectionVersion(
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void> {
  return upsertProjectionVersionRepo(projectionName, lastEventOffset, readModelVersion);
}
