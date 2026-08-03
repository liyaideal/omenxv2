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

// ------------------------------------------------------------------
// League → local kickoff zone. Single source of truth: kickoff_at is
// stored UTC, the ledger renders the league's own local wall clock.
// ------------------------------------------------------------------
interface LeagueZone {
  tz: string;
  label: string;
}

const ET: LeagueZone = { tz: "America/New_York", label: "ET" };
const CET: LeagueZone = { tz: "Europe/Berlin", label: "CET" };
const BST: LeagueZone = { tz: "Europe/London", label: "BST" };
const CST: LeagueZone = { tz: "Asia/Shanghai", label: "CST" };
const KST: LeagueZone = { tz: "Asia/Seoul", label: "KST" };

const LEAGUE_ZONES: Array<[RegExp, LeagueZone]> = [
  [/champions|^ucl\b/i, CET],
  [/chinese super|^csl\b/i, CST],
  [/k league/i, KST],
  [/^ufc/i, ET],
  [/premier league|^epl\b/i, BST],
  [/laliga|la liga|serie a|bundesliga|ligue 1|eredivisie|atp|wta/i, CET],
];

export const zoneForLeague = (league: string): LeagueZone => {
  for (const [re, zone] of LEAGUE_ZONES) if (re.test(league)) return zone;
  return ET;
};

/** Kickoff time cell — league-local HH:mm + the zone micro-label. */
export const kickoffCell = (
  d: Date | null,
  league: string,
): { time: string; zone: string } => {
  const zone = zoneForLeague(league);
  if (!d) return { time: "TBD", zone: zone.label };
  return {
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: zone.tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d),
    zone: zone.label,
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
export const buildDayGroups = (rows: SportsMatch[]): DayGroup[] => {
  const today = startOfDay(new Date());
  const byDay = new Map<number, SportsMatch[]>();
  for (const r of rows) {
    if (!r.kickoff) continue;
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
      const liveCount = all.length - list.length;
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