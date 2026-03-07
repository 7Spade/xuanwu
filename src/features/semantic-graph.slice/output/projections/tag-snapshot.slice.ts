/**
 * Module: tag-snapshot.slice.ts
 * Purpose: Expose semantic-tag snapshot read API with UI-safe presentation metadata.
 * Responsibilities: provide tag label/category/icon/color from projection.tag-snapshot.
 * Constraints: deterministic logic, respect module boundaries
 */

import { getTagSnapshot } from '@/shared-infra/projection-bus';

export type TagSnapshotColorToken = 'neutral' | 'warning' | 'info' | 'success';
export type TagSnapshotIconToken = 'hammer' | 'briefcase' | 'shield' | 'coins';

export interface TagSnapshotPresentation {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: string;
  readonly iconToken: TagSnapshotIconToken;
  readonly colorToken: TagSnapshotColorToken;
}

const CATEGORY_TO_VISUAL: Record<string, Pick<TagSnapshotPresentation, 'iconToken' | 'colorToken'>> = {
  EXECUTABLE: { iconToken: 'hammer', colorToken: 'success' },
  MANAGEMENT: { iconToken: 'briefcase', colorToken: 'warning' },
  RESOURCE: { iconToken: 'shield', colorToken: 'info' },
  FINANCIAL: { iconToken: 'coins', colorToken: 'warning' },
  PROFIT: { iconToken: 'coins', colorToken: 'neutral' },
  ALLOWANCE: { iconToken: 'briefcase', colorToken: 'neutral' },
};

function resolvePresentationByCategory(category: string): Pick<TagSnapshotPresentation, 'iconToken' | 'colorToken'> {
  return CATEGORY_TO_VISUAL[category.toUpperCase()] ?? {
    iconToken: 'hammer',
    colorToken: 'neutral',
  };
}

export async function getTagSnapshotPresentation(tagSlug: string): Promise<TagSnapshotPresentation | null> {
  const snapshot = await getTagSnapshot(tagSlug);

  if (!snapshot) {
    return null;
  }

  const visual = resolvePresentationByCategory(snapshot.category);

  return {
    tagSlug: snapshot.tagSlug,
    label: snapshot.label,
    category: snapshot.category,
    iconToken: visual.iconToken,
    colorToken: visual.colorToken,
  };
}

export async function getTagSnapshotPresentationMap(
  tagSlugs: readonly string[],
): Promise<Record<string, TagSnapshotPresentation>> {
  const uniqueTagSlugs = Array.from(new Set(tagSlugs));
  const entries = await Promise.all(
    uniqueTagSlugs.map(async (tagSlug) => {
      const presentation = await getTagSnapshotPresentation(tagSlug);
      return [tagSlug, presentation] as const;
    }),
  );

  return entries.reduce<Record<string, TagSnapshotPresentation>>((map, [tagSlug, presentation]) => {
    if (presentation) {
      map[tagSlug] = presentation;
    }
    return map;
  }, {});
}
