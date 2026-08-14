// ============================================================
// Sports module — data layer.
// Reads SPORTS_MATCH contract events. Display-only; no writes.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SPORTS_SUBTYPE = "SPORTS_MATCH";

export interface SportsOption {
  id: string;
  label: string;
  price: number;
}

export interface SportsMatch {
  id: string;
  name: string;
  league: string;
  home: string;
  away: string;
  homeAbbr: string;
  awayAbbr: string;
  format: "1x2" | "h2h";
  kickoff: Date | null;
  endDate: Date | null;
  live: boolean;
  minute: number | null;
  phase: string | null;
  score: string | null;
  volume: number;
  options: SportsOption[];
}

interface RawMeta {
  league?: string;
  home?: string;
  away?: string;
  home_abbr?: string;
  away_abbr?: string;
  format?: string;
  kickoff_at?: string;
  live?: boolean;
  minute?: number | null;
  phase?: string | null;
  score?: string | null;
}

/** Live matches age their own clock off the kickoff timestamp. */
const liveMinute = (kickoff: Date | null): number | null => {
  if (!kickoff) return null;
  const m = Math.floor((Date.now() - kickoff.getTime()) / 60_000);
  return Math.max(1, Math.min(90, m));
};

export const useSportsMatches = () => {
  const [rows, setRows] = useState<SportsMatch[]>([]);
  const [loading, setLoading] = useState(true);
  // Live/upcoming classification is clock-driven — re-derive every 30s.
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setClock((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select(
          "id, name, start_date, end_date, volume, metadata, event_options(id, label, price)",
        )
        .eq("event_subtype", SPORTS_SUBTYPE)
        .eq("is_resolved", false)
        .order("start_date", { ascending: true });
      if (!alive) return;
      const list: SportsMatch[] = (data || []).map((e) => {
        const meta = ((e as { metadata?: RawMeta | null }).metadata || {}) as RawMeta;
        const kickoff = meta.kickoff_at
          ? new Date(meta.kickoff_at)
          : e.start_date
            ? new Date(e.start_date)
            : null;
        const endDate = e.end_date ? new Date(e.end_date) : null;
        // In play = the clock says so. A match that has kicked off and has
        // not reached its end time is live regardless of the metadata flag.
        const now = Date.now();
        const isLive =
          !!kickoff &&
          kickoff.getTime() <= now &&
          !!endDate &&
          endDate.getTime() > now;
        const opts = ((e.event_options || []) as {
          id: string;
          label: string;
          price: number | string;
        }[])
          .map((o) => ({ id: o.id, label: o.label, price: Number(o.price) }))
          .sort((a, b) => a.id.localeCompare(b.id));
        return {
          id: e.id,
          name: e.name,
          league: meta.league || "",
          home: meta.home || "",
          away: meta.away || "",
          homeAbbr: meta.home_abbr || "",
          awayAbbr: meta.away_abbr || "",
          format: meta.format === "h2h" ? "h2h" : "1x2",
          kickoff,
          endDate,
          live: isLive,
          minute: isLive ? liveMinute(kickoff) : null,
          phase: meta.phase ?? null,
          score: meta.score ?? null,
          volume: Number((e as { volume?: number | string | null }).volume ?? 0),
          options: opts,
        };
      });
      setRows(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [clock]);

  const live = useMemo(() => rows.filter((r) => r.live), [rows]);
  const upcoming = useMemo(
    () =>
      rows
        .filter((r) => !r.live && isUpcoming(r))
        .sort(
          (a, b) =>
            (a.kickoff?.getTime() ?? Infinity) - (b.kickoff?.getTime() ?? Infinity),
        ),
    [rows],
  );

  return { rows, live, upcoming, loading };
};

/**
 * Ledger rule: only matches whose kickoff is still in the future are
 * listed. Anything already kicked off shows in the pinned live section
 * (when in play) or nowhere at all.
 */
export const isUpcoming = (m: SportsMatch, now: number = Date.now()) =>
  !!m.kickoff && m.kickoff.getTime() > now;

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export interface DayBucket {
  id: string;
  label: string;
  count: number;
}

/** "ALL" + one chip per day over the next 7 days that has matches. */
export const buildDayStrip = (
  rows: SportsMatch[],
  now: number = Date.now(),
): DayBucket[] => {
  const today = startOfDay(new Date(now));
  const future = rows.filter((r) => isUpcoming(r, now));
  const counts = new Map<number, number>();
  for (const r of future) {
    if (!r.kickoff) continue;
    const k = startOfDay(r.kickoff);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const out: DayBucket[] = [{ id: "all", label: "ALL", count: future.length }];
  for (let i = 0; i < 7; i += 1) {
    const k = today + i * DAY_MS;
    const n = counts.get(k) || 0;
    if (n === 0) continue;
    const d = new Date(k);
    out.push({
      id: String(k),
      label:
        i === 0
          ? "TODAY"
          : `${d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()} ${d.getDate()}`,
      count: n,
    });
  }
  return out;
};

export const matchesInBucket = (rows: SportsMatch[], bucket: string) => {
  if (bucket === "all") return rows;
  const k = Number(bucket);
  return rows.filter((r) => r.kickoff && startOfDay(r.kickoff) === k);
};

/** "Today 19:00" / "Tue 19:35" split into two lines. */
export const kickoffLabel = (d: Date | null): { day: string; time: string } => {
  if (!d) return { day: "TBD", time: "" };
  const today = startOfDay(new Date());
  const k = startOfDay(d);
  const day =
    k === today
      ? "Today"
      : k === today + DAY_MS
        ? "Tmrw"
        : d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { day, time };
};

/** Kickoff time cell — user-local HH:mm, no timezone label. */
export const kickoffCell = (d: Date | null): { time: string } => {
  if (!d) return { time: "TBD" };
  return {
    time: d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
};

export interface DayGroup {
  key: number;
  label: string;
  note: string;
  matches: SportsMatch[];
}

const dayTitle = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

/**
 * Day-grouped ledger. Live matches are pinned above the ledger, so they
 * are excluded from the rows but still counted in today's note.
 */
export const buildDayGroups = (
  rows: SportsMatch[],
  now: number = Date.now(),
): DayGroup[] => {
  const today = startOfDay(new Date(now));
  const byDay = new Map<number, SportsMatch[]>();
  for (const r of rows) {
    if (!r.kickoff || !isUpcoming(r, now)) continue;
    const k = startOfDay(r.kickoff);
    byDay.set(k, [...(byDay.get(k) || []), r]);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, all]) => {
      const list = all
        .filter((m) => !m.live)
        .sort(
          (a, b) =>
            (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0),
        );
      const liveCount = rows.filter(
        (m) => m.live && m.kickoff && startOfDay(m.kickoff) === k,
      ).length;
      const d = new Date(k);
      const isToday = k === today;
      return {
        key: k,
        label: isToday ? `Today · ${dayTitle(d)}` : dayTitle(d),
        note: isToday
          ? `${liveCount} playing now · ${list.length} to come`
          : `${all.length} ${all.length === 1 ? "match" : "matches"}`,
        matches: list,
      };
    })
    .filter((g) => g.matches.length > 0);
};

/** "$182K" style compact volume used by the ledger rows. */
export const compactVolume = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};