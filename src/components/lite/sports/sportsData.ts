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

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select(
          "id, name, start_date, end_date, metadata, event_options(id, label, price)",
        )
        .eq("event_subtype", SPORTS_SUBTYPE)
        .eq("is_resolved", false)
        .order("start_date", { ascending: true });
      if (!alive) return;
      const list: SportsMatch[] = (data || []).map((e) => {
        const meta = ((e as { metadata?: RawMeta | null }).metadata || {}) as RawMeta;
        const kickoff = e.start_date ? new Date(e.start_date) : null;
        const endDate = e.end_date ? new Date(e.end_date) : null;
        const isLive =
          !!meta.live && !!endDate && endDate.getTime() > Date.now();
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
          options: opts,
        };
      });
      setRows(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const live = useMemo(() => rows.filter((r) => r.live), [rows]);
  const upcoming = useMemo(
    () =>
      rows
        .filter((r) => !r.live)
        .sort(
          (a, b) =>
            (a.kickoff?.getTime() ?? Infinity) - (b.kickoff?.getTime() ?? Infinity),
        ),
    [rows],
  );

  return { rows, live, upcoming, loading };
};

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export interface DayBucket {
  id: string;
  label: string;
  count: number;
}

/** "ALL" + one chip per day over the next 7 days that has matches. */
export const buildDayStrip = (rows: SportsMatch[]): DayBucket[] => {
  const today = startOfDay(new Date());
  const counts = new Map<number, number>();
  for (const r of rows) {
    if (!r.kickoff) continue;
    const k = startOfDay(r.kickoff);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const out: DayBucket[] = [{ id: "all", label: "ALL", count: rows.length }];
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