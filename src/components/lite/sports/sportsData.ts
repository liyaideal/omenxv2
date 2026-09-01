// ============================================================
// Sports module — data layer.
// Reads SPORTS_MATCH contract events. Display-only; no writes.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SPORT_SEGMENTS } from "@/lib/sportSegments";


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
  /** metadata.stream_url — non-empty means the match has a watchable stream. */
  streamUrl?: string | null;
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
  /** Sports game lines — every market of one match shares this id. */
  fixture_id?: string;
  market_type?: "winner" | "handicap" | "total" | "mapwin" | "method" | "distance";
  /** Handicap = home-team perspective, signed. Total = positive. */
  line?: number;
  sport?: string;
  /** `main` fixture body vs `seg` segment sibling. Absent ⇒ `main`. */
  family?: "main" | "seg";
  /** Static SPORT_SEGMENTS lookup key. Never derive this from `league`. */
  segments_key?: string;
  /** 1-based index of the segment currently in play. */
  segment_index?: number | null;
  /** One `{home,away}` or `null` per segment. */
  segment_results?: ({ home: number; away: number } | null)[] | null;
  /** UFC round clock, seconds remaining. */
  clock?: number | null;
  stream_url?: string | null;
}

export type FixtureMeta = RawMeta;

/** Reads the sports metadata blob off any events row. */
export const fixtureMeta = (e: { metadata?: unknown } | null | undefined): FixtureMeta =>
  ((e?.metadata as FixtureMeta | null) || {}) as FixtureMeta;

/**
 * Single source of truth for "is this fixture in play".
 * `metadata.live` is engine debug output and is never read by the UI.
 */
export const isFixtureLive = (
  e:
    | {
        start_date?: string | null;
        end_date?: string | null;
        is_resolved?: boolean | null;
        metadata?: unknown;
      }
    | null
    | undefined,
  now: number = Date.now(),
): boolean => {
  if (!e || e.is_resolved) return false;
  const meta = fixtureMeta(e);
  const kickoff = meta.kickoff_at
    ? new Date(meta.kickoff_at).getTime()
    : e.start_date
      ? new Date(e.start_date).getTime()
      : NaN;
  const end = e.end_date ? new Date(e.end_date).getTime() : NaN;
  if (!Number.isFinite(kickoff) || !Number.isFinite(end)) return false;
  return kickoff <= now && now < end;
};


/**
 * Handicap / Total / Map winner / Method / Distance siblings are only
 * reachable through their fixture board, never through a generic market
 * list, ledger or watchlist.
 */
export const isFixtureSibling = (e: unknown): boolean => {
  const mt = fixtureMeta(e as { metadata?: unknown } | null).market_type;
  return (
    mt === "handicap" ||
    mt === "total" ||
    mt === "mapwin" ||
    mt === "method" ||
    mt === "distance"
  );
};

/** PostgREST filter equivalent of `!isFixtureSibling`: only `null` and
 *  `winner` pass, which already covers every sibling type. */
export const NON_SIBLING_FILTER =
  "metadata->>market_type.is.null,metadata->>market_type.eq.winner";


/** "+1.5" / "−1.5" — real minus sign (U+2212) for negatives. */
export const formatSignedLine = (n: number): string => {
  const abs = Math.abs(n);
  const body = Number.isInteger(abs) ? String(abs) : String(abs);
  return `${n < 0 ? "\u2212" : "+"}${body}`;
};

/** Sport-aware scoring noun for the Total group. */
export const scoringNoun = (meta: FixtureMeta): "goals" | "points" => {
  const sport = (meta.sport || "").toLowerCase();
  if (sport) return sport === "basketball" ? "points" : "goals";
  const league = (meta.league || "").toLowerCase();
  return /nba|basket|wnba|euroleague/.test(league) ? "points" : "goals";
};

/**
 * Splits the sibling events of one fixture into their market groups.
 * Handicap / Total are sorted by line ascending.
 */
export const groupFixtureMarkets = <T extends { metadata?: unknown }>(
  events: T[],
): { winner: T | null; handicap: T[]; total: T[] } => {
  const byLine = (a: T, b: T) => (fixtureMeta(a).line ?? 0) - (fixtureMeta(b).line ?? 0);
  const of = (t: string) => events.filter((e) => fixtureMeta(e).market_type === t);
  return {
    winner: of("winner")[0] ?? null,
    handicap: of("handicap").sort(byLine),
    total: of("total").sort(byLine),
  };
};

// ---- Segmented boards (esports maps / MMA rounds) ---------------------
// Football keeps `groupFixtureMarkets` above untouched. Fixtures that carry
// a `segments_key` render vertical groups instead: one series-level group
// plus one group per segment (CS2), or fight lines + method (MMA).
export interface BoardGroup<T> {
  /** Stable DOM id: `grp-series` | `grp-seg-1` | `grp-fight` | `grp-method` */
  key: string;
  title: string;
  /** 1-based segment this group settles on; null for series-level groups. */
  segmentIndex: number | null;
  winner: T | null;
  mapwin: T | null;
  handicap: T[];
  total: T[];
  method: T[];
  distance: T | null;
}

const emptyGroup = <T,>(key: string, title: string, segmentIndex: number | null): BoardGroup<T> => ({
  key,
  title,
  segmentIndex,
  winner: null,
  mapwin: null,
  handicap: [],
  total: [],
  method: [],
  distance: null,
});

const groupIsEmpty = <T,>(g: BoardGroup<T>) =>
  !g.winner &&
  !g.mapwin &&
  !g.distance &&
  g.handicap.length === 0 &&
  g.total.length === 0 &&
  g.method.length === 0;

export const groupSegmentedMarkets = <T extends { id?: string; metadata?: unknown }>(
  fixture: T,
  siblings: T[],
  currentSegment: number | null,
): BoardGroup<T>[] => {
  const meta = fixtureMeta(fixture);
  const spec = meta.segments_key ? SPORT_SEGMENTS[meta.segments_key] : undefined;
  const sport = (meta.sport || "").toLowerCase();
  const byLine = (a: T, b: T) => (fixtureMeta(a).line ?? 0) - (fixtureMeta(b).line ?? 0);
  const of = (t: string) => siblings.filter((e) => fixtureMeta(e).market_type === t);
  const groups: BoardGroup<T>[] = [];

  if (sport === "esports") {
    const series = emptyGroup<T>("grp-series", "Series lines", null);
    series.winner = fixture;
    series.mapwin =
      currentSegment != null
        ? (of("mapwin").find((e) =>
            String((e as { id?: string }).id ?? "").endsWith(`-mapwin-${currentSegment}`),
          ) ?? null)
        : null;
    series.handicap = of("handicap")
      .filter((e) => fixtureMeta(e).family === "main")
      .sort(byLine);
    series.total = of("total")
      .filter((e) => fixtureMeta(e).family === "main")
      .sort(byLine);
    groups.push(series);

    for (let n = 1; n <= (spec?.total ?? 0); n += 1) {
      const g = emptyGroup<T>(`grp-seg-${n}`, `Map ${n}`, n);
      const isSeg = (e: T) =>
        fixtureMeta(e).family === "seg" && fixtureMeta(e).segment_index === n;
      g.handicap = of("handicap").filter(isSeg).sort(byLine);
      g.total = of("total").filter(isSeg).sort(byLine);
      groups.push(g);
    }
  } else if (sport === "mma") {
    const fight = emptyGroup<T>("grp-fight", "Fight lines", null);
    fight.winner = fixture;
    fight.total = of("total").sort(byLine);
    groups.push(fight);

    const method = emptyGroup<T>("grp-method", "Method", null);
    method.method = of("method").sort((a, b) =>
      String((a as { id?: string }).id ?? "").localeCompare(String((b as { id?: string }).id ?? "")),
    );
    method.distance = of("distance")[0] ?? null;
    groups.push(method);
  }

  return groups.filter((g) => !groupIsEmpty(g));
};



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
      const list: SportsMatch[] = (data || [])
        // Game-line siblings (handicap / total) belong to their fixture's
        // trade board, never to the match ledger.
        .filter((e) => {
          const mt = ((e as { metadata?: RawMeta | null }).metadata || {}).market_type;
          return !mt || mt === "winner";
        })
        .map((e) => {
        const meta = ((e as { metadata?: RawMeta | null }).metadata || {}) as RawMeta;
        const kickoff = meta.kickoff_at
          ? new Date(meta.kickoff_at)
          : e.start_date
            ? new Date(e.start_date)
            : null;
        const endDate = e.end_date ? new Date(e.end_date) : null;
        // In play = the clock says so (single source of truth: isFixtureLive).
        // `metadata.live` is engine debug output and is never read here.
        const isLive = isFixtureLive(e as Parameters<typeof isFixtureLive>[0]);

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
           streamUrl: meta.stream_url ?? null,
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