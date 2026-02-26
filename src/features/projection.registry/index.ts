// projection.registry — Event stream offset + read model version table
export {
  getProjectionVersion,
  upsertProjectionVersion,
  type ProjectionVersionRecord,
} from './_registry';

export { registerAllQueryHandlers } from './_query-registration';
