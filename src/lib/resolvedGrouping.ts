import { format, startOfWeek, startOfMonth, isAfter } from "date-fns";
import type { ResolvedEvent } from "@/hooks/useResolvedEvents";

export interface ResolvedGroup {
  key: string;
  label: string;
  events: ResolvedEvent[];
}

/**
 * Group resolved events by settled_at into buckets:
 * - "This Week"  (within current ISO week)
 * - "Earlier This Month"  (rest of current month)
 * - "MMMM YYYY"  (older months)
 *
 * Preserves the input order within each bucket.
 */
export const groupBySettledAt = (events: ResolvedEvent[]): ResolvedGroup[] => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const buckets = new Map<string, ResolvedGroup>();

  const push = (key: string, label: string, evt: ResolvedEvent) => {
    if (!buckets.has(key)) {
      buckets.set(key, { key, label, events: [] });
    }
    buckets.get(key)!.events.push(evt);
  };

  for (const evt of events) {
    const ts = evt.settled_at ? new Date(evt.settled_at) : null;
    if (!ts || isNaN(ts.getTime())) {
      push("unknown", "Undated", evt);
      continue;
    }
    if (isAfter(ts, weekStart)) {
      push("this-week", "This Week", evt);
    } else if (isAfter(ts, monthStart)) {
      push("earlier-month", "Earlier This Month", evt);
    } else {
      const key = format(ts, "yyyy-MM");
      push(key, format(ts, "MMMM yyyy"), evt);
    }
  }

  // Order: this-week, earlier-month, then months desc, then unknown last
  const ordered: ResolvedGroup[] = [];
  if (buckets.has("this-week")) ordered.push(buckets.get("this-week")!);
  if (buckets.has("earlier-month")) ordered.push(buckets.get("earlier-month")!);

  const monthKeys = Array.from(buckets.keys())
    .filter((k) => k !== "this-week" && k !== "earlier-month" && k !== "unknown")
    .sort()
    .reverse();
  for (const k of monthKeys) ordered.push(buckets.get(k)!);

  if (buckets.has("unknown")) ordered.push(buckets.get("unknown")!);
  return ordered;
};
