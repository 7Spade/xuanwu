/**
 * scheduling.slice/_projectors — account-schedule-queries.ts
 *
 * @deprecated Queries have been merged into scheduling.slice/_queries.ts.
 * This file is retained only to avoid breaking any direct internal imports
 * and will be removed in a future cleanup pass.
 *
 * Read-side queries for the account schedule projection.
 * Canonical query logic now lives in scheduling.slice/_queries.ts.
 */

export {
  getAccountScheduleProjection,
  getAccountActiveAssignments,
} from '../_queries';
