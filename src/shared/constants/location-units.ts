/**
 * @fileoverview shared/constants/location-units.ts — Location measurement unit constants.
 *
 * Covers the common spatial / positional designators used in Taiwanese
 * technology parks, industrial estates, science parks and construction sites:
 *   棟 (building block), 樓 (floor), 區 (zone), 室 (room/unit), 號 (number),
 *   廠 (factory/plant), 倉 (warehouse), 期 (phase), 座 (tower), 基地 (campus/site),
 *   柱 (structural column / pillar position)
 *
 * Usage:
 *   import { LOCATION_UNITS, LOCATION_UNIT_BY_KEY, type LocationUnitKey }
 *     from '@/shared/constants/location-units';
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** Stable key for a location unit — used as the value in form fields / data models. */
export type LocationUnitKey =
  | 'dong'    // 棟 — building / block
  | 'lou'     // 樓 — floor / storey
  | 'qu'      // 區 — zone / section / area
  | 'shi'     // 室 — room / unit / suite
  | 'hao'     // 號 — number (address / door number)
  | 'chang'   // 廠 — factory / plant
  | 'cang'    // 倉 — warehouse / storage unit
  | 'qi'      // 期 — phase / stage (of a development)
  | 'zuo'     // 座 — tower / seat (high-rise identifier)
  | 'jidi'    // 基地 — campus / site / base
  | 'zhu';    // 柱 — structural column / pillar position

export interface LocationUnitMeta {
  key: LocationUnitKey;
  /** Chinese character / label */
  zhLabel: string;
  /** English equivalent */
  enLabel: string;
  /** Short usage description in Chinese */
  description: string;
  /** Typical example value (for placeholder / hint text) */
  example: string;
}

// ---------------------------------------------------------------------------
// Canonical unit list
// ---------------------------------------------------------------------------

export const LOCATION_UNITS: readonly LocationUnitMeta[] = [
  {
    key: 'dong',
    zhLabel: '棟',
    enLabel: 'Building / Block',
    description: '建築物編號，如 A棟、1棟',
    example: 'A棟',
  },
  {
    key: 'lou',
    zhLabel: '樓',
    enLabel: 'Floor / Storey',
    description: '樓層，如 3樓、B1',
    example: '3樓',
  },
  {
    key: 'qu',
    zhLabel: '區',
    enLabel: 'Zone / Section',
    description: '園區分區，如 A區、南區',
    example: 'A區',
  },
  {
    key: 'shi',
    zhLabel: '室',
    enLabel: 'Room / Suite',
    description: '室內單元，如 101室',
    example: '101室',
  },
  {
    key: 'hao',
    zhLabel: '號',
    enLabel: 'Number',
    description: '門牌或編號，如 15號',
    example: '15號',
  },
  {
    key: 'chang',
    zhLabel: '廠',
    enLabel: 'Factory / Plant',
    description: '廠房編號，如 一廠、2廠',
    example: '一廠',
  },
  {
    key: 'cang',
    zhLabel: '倉',
    enLabel: 'Warehouse',
    description: '倉儲編號，如 甲倉、1倉',
    example: '甲倉',
  },
  {
    key: 'qi',
    zhLabel: '期',
    enLabel: 'Phase',
    description: '開發期別，如 一期、Phase 2',
    example: '一期',
  },
  {
    key: 'zuo',
    zhLabel: '座',
    enLabel: 'Tower / Seat',
    description: '高樓或塔樓識別，如 東座、A座',
    example: 'A座',
  },
  {
    key: 'jidi',
    zhLabel: '基地',
    enLabel: 'Campus / Site',
    description: '整體園區或廠區，如 新竹基地',
    example: '新竹基地',
  },
  {
    key: 'zhu',
    zhLabel: '柱',
    enLabel: 'Column / Pillar',
    description: '以結構柱位定位，如 A3柱、第5柱',
    example: 'A3柱',
  },
] as const;

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** O(1) lookup map: LocationUnitKey → LocationUnitMeta */
export const LOCATION_UNIT_BY_KEY = new Map<LocationUnitKey, LocationUnitMeta>(
  LOCATION_UNITS.map((u) => [u.key, u])
);

/** Ordered array of Chinese labels — useful for plain dropdown lists. */
export const LOCATION_UNIT_ZH_LABELS: readonly string[] = LOCATION_UNITS.map((u) => u.zhLabel);

/** Returns the metadata for a unit key, or undefined if not found. */
export function findLocationUnit(key: string): LocationUnitMeta | undefined {
  return LOCATION_UNIT_BY_KEY.get(key as LocationUnitKey);
}
