/**
 * Module: unified-calendar-grid.utils.ts
 * Purpose: Pure calendar data shaping for schedule grid rendering.
 * Responsibilities: normalize dates, group cards by day, build span segments
 * Constraints: deterministic logic, respect module boundaries
 */

import { eachDayOfInterval, format, isBefore } from "date-fns";

import type { ScheduleItem, Timestamp } from "@/shared-kernel";

export type CalendarTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number } | null | undefined;

type TimestampLike = { toDate: () => Date };
type SecondsLike = { seconds: number };

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function';
}

function isSecondsLike(value: unknown): value is SecondsLike {
  return typeof value === 'object' && value !== null && 'seconds' in value && typeof value.seconds === 'number';
}

export type SpanSegment = {
  item: ScheduleItem;
  isStart: boolean;
  isEnd: boolean;
};

export function toCalendarDate(timestamp: CalendarTimestamp): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (isTimestampLike(timestamp)) return timestamp.toDate();
  if (isSecondsLike(timestamp)) {
    return new Date(timestamp.seconds * 1000);
  }
  return null;
}

export function normalizeScheduleRange(item: ScheduleItem): { start: Date; end: Date } | null {
  const rawStart = toCalendarDate(item.startDate);
  const rawEnd = toCalendarDate(item.endDate);
  if (!rawStart && !rawEnd) return null;

  const start = rawStart || rawEnd!;
  const end = rawEnd || rawStart!;

  if (isBefore(end, start)) {
    return { start: end, end: start };
  }

  return { start, end };
}

export function buildCardsByDate(items: ScheduleItem[]): Map<string, ScheduleItem[]> {
  const map = new Map<string, ScheduleItem[]>();

  items.forEach((item) => {
    const range = normalizeScheduleRange(item);
    if (!range) return;

    const dateKey = format(range.start, "yyyy-MM-dd");
    const dayItems = map.get(dateKey) || [];
    map.set(dateKey, [...dayItems, item]);
  });

  return map;
}

export function buildSpanSegmentsByDate(items: ScheduleItem[]): Map<string, SpanSegment[]> {
  const map = new Map<string, SpanSegment[]>();

  items.forEach((item) => {
    const range = normalizeScheduleRange(item);
    if (!range) return;

    const days = eachDayOfInterval({ start: range.start, end: range.end });
    days.forEach((day, index) => {
      const key = format(day, "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push({
        item,
        isStart: index === 0,
        isEnd: index === days.length - 1,
      });
      map.set(key, existing);
    });
  });

  return map;
}

export function sortSegments(segments: SpanSegment[]): SpanSegment[] {
  return segments.slice().sort((left, right) => {
    const leftStart = toCalendarDate(left.item.startDate)?.getTime() ?? 0;
    const rightStart = toCalendarDate(right.item.startDate)?.getTime() ?? 0;
    if (leftStart !== rightStart) return leftStart - rightStart;
    return left.item.title.localeCompare(right.item.title, "zh-Hant");
  });
}
