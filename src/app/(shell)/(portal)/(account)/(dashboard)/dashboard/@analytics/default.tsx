/**
 * @analytics default — null fallback for every sub-route under /dashboard/*.
 * Prevents a 404 when Next.js cannot match a `page.tsx` inside this slot.
 */
export default function AnalyticsDefault() {
  return null;
}
