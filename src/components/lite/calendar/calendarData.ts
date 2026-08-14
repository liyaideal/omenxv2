// ============================================================
// Calendar view — data layer.
// Pure builders shared by the desktop week/day frames, the mobile
// week frame and the /style-guide presets. Every function takes an
// explicit `now` so the style guide can freeze the clock.
// Pixel contract: docs/design-contracts/calendar-final.html
// ============================================================
import { EventRow } from "@/hooks/useMarketListData";
import { SportsMatch } from "@/components/lite/sports/sportsData";
import {
  ALL_LEAGUES,
  SPORTS_GROUPS,
  categoryMatchesTop,
  leagueCodeFor,
  sportGroupFor,
} from "@/lib/taxonomy";
import {
  INTRADAY_SUBTYPES,
  StockEventRow,
} from "@/components/lite/intraday/intradayData";
import {
  resolveStockMarket,
  StockMarket,
} from "@/lib/usStockSessions";

export const DAY_MS = 86_400_000;
export const WEEK_DAYS = 7;

export const startOfDay = (t: number | Date): number => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export const startOfMonth = (t: number | Date): number => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

export const addMonths = (t: number, n: number): number => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
};

/* ---------------- Items ---------------- */

interface CalBase {
  id: string;
  /** Decision moment, in absolute time. */
  at: Date;
  /** Tradeable window — opens at `from`, stops trading at `to` (= `at`). */
  from: Date;
  to: Date;
  /** True when the tradeable window covers more than one calendar day. */
  spanning: boolean;
}

export type CalItem =
  | (CalBase & { kind: "sports"; match: SportsMatch })
  | (CalBase & { kind: "session"; market: StockMarket; rows: StockEventRow[] })
  | (CalBase & { kind: "generic"; row: EventRow });

/** A stock session close carries N markets; everything else carries one. */
export const marketCountOf = (item: CalItem): number =>
  item.kind === "session" ? item.rows.length : 1;

/** "US" / "HK" / "KR" — short market name used by the session copy. */
export const marketShortName = (market: StockMarket): string =>
  market.short;

export const sumMarkets = (items: CalItem[]): number =>
  items.reduce((n, i) => n + marketCountOf(i), 0);

export interface BuildInput {
  events: EventRow[];
  matches: SportsMatch[];
  stocks: StockEventRow[];
  now?: number;
  /** Horizon in days for point-in-time items. Spans are only clipped, never dropped. */
  horizonDays?: number;
}

/**
 * Every market that is tradeable inside the window. Markets are intervals
 * (`start_date` → `end_date`), not points: a market that opened in July and
 * closes in September is present on every day in between.
 * Rolling intraday crypto rounds are excluded by design — they live in
 * the standing orange row above the timeline.
 */
export const buildCalendarItems = ({
  events,
  matches,
  stocks,
  now = Date.now(),
  horizonDays = WEEK_DAYS,
}: BuildInput): CalItem[] => {
  const from = startOfDay(now);
  const to = from + horizonDays * DAY_MS;
  const inWindow = (t: number) => t >= from && t < to;
  const out: CalItem[] = [];

  // Generic events — the whole tradeable window counts, not just the close.
  for (const row of events) {
    if (!row.expiry) continue;
    if ((row.category || "").toLowerCase() === "sports") continue;
    if (
      row.eventSubtype &&
      (INTRADAY_SUBTYPES as readonly string[]).includes(row.eventSubtype)
    )
      continue;
    const closes = row.expiry.getTime();
    if (closes <= now) continue;
    // Missing open date == already open.
    const opens = row.opensAt ? row.opensAt.getTime() : from;
    if (opens >= to) continue; // opens past the horizon
    const openDay = startOfDay(Math.max(opens, from));
    const spanning = openDay < startOfDay(closes);
    // Point-in-time markets outside the horizon have no home; spans always do.
    if (!spanning && !inWindow(closes)) continue;
    out.push({
      kind: "generic",
      id: `g-${row.id}`,
      at: row.expiry,
      from: new Date(Math.max(opens, from)),
      to: row.expiry,
      spanning,
      row,
    });
  }

  // Sports — kickoff is the decision moment. Live matches stay listed.
  for (const m of matches) {
    if (!m.kickoff) continue;
    const t = m.kickoff.getTime();
    if (!inWindow(t)) continue;
    if (t <= now && !m.live) continue;
    out.push({
      kind: "sports",
      id: `s-${m.id}`,
      at: m.kickoff,
      from: m.kickoff,
      to: m.kickoff,
      spanning: false,
      match: m,
    });
  }

  // Stock dailies — aggregated per market close moment, never one item
  // per stock.
  const bells = new Map<string, { at: Date; market: StockMarket; rows: StockEventRow[] }>();
  for (const s of stocks) {
    if (!s.end_date) continue;
    const at = new Date(s.end_date);
    const t = at.getTime();
    if (t <= now || !inWindow(t)) continue;
    const market = resolveStockMarket(s);
    const key = `${market.label}-${Math.floor(t / 60_000)}`;
    const bucket = bells.get(key);
    if (bucket) bucket.rows.push(s);
    else bells.set(key, { at, market, rows: [s] });
  }
  for (const [key, b] of bells) {
    out.push({
      kind: "session",
      id: `c-${key}`,
      at: b.at,
      from: b.at,
      to: b.at,
      spanning: false,
      market: b.market,
      rows: b.rows,
    });
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
};

/* ---------------- Span placement ---------------- */

export interface SpanPlacement {
  item: CalItem;
  /** 0-based column index inside the frame. */
  colStart: number;
  colSpan: number;
  clippedLeft: boolean;
  clippedRight: boolean;
}

/**
 * Greedy lane packing: each returned array is one row of non-overlapping
 * bars, laid out over `days` columns starting at `windowStart`.
 */
export const buildSpanLanes = (
  items: CalItem[],
  windowStart: number,
  days: number,
): SpanPlacement[][] => {
  const windowEnd = windowStart + days * DAY_MS;
  const placed: SpanPlacement[] = [];
  for (const item of items) {
    if (!item.spanning) continue;
    const openDay = startOfDay(item.from);
    const closeDay = startOfDay(item.to);
    if (closeDay < windowStart || openDay >= windowEnd) continue;
    const startKey = Math.max(openDay, windowStart);
    const endKey = Math.min(closeDay, windowEnd - DAY_MS);
    const colStart = Math.round((startKey - windowStart) / DAY_MS);
    const colSpan = Math.round((endKey - startKey) / DAY_MS) + 1;
    placed.push({
      item,
      colStart,
      colSpan,
      clippedLeft: openDay < windowStart,
      clippedRight: closeDay > windowEnd - DAY_MS,
    });
  }
  placed.sort(
    (a, b) => a.colStart - b.colStart || b.colSpan - a.colSpan,
  );
  const lanes: SpanPlacement[][] = [];
  for (const p of placed) {
    const lane = lanes.find((l) => {
      const last = l[l.length - 1];
      return last.colStart + last.colSpan <= p.colStart;
    });
    if (lane) lane.push(p);
    else lanes.push([p]);
  }
  return lanes;
};

/** Markets tradeable on a given day but not closing on it. */
export const openOnDay = (items: CalItem[], dayKey: number): CalItem[] =>
  items.filter(
    (i) =>
      i.spanning &&
      startOfDay(i.from) <= dayKey &&
      startOfDay(i.to) > dayKey,
  );

/** Markets whose trading stops on that exact day (the point items). */
export const closingOnDay = (items: CalItem[], dayKey: number): CalItem[] =>
  items.filter((i) => startOfDay(i.at) === dayKey);

/* ---------------- Month grid ---------------- */

export interface MonthCellModel {
  key: number;
  /** Day-of-month number. */
  day: number;
  inMonth: boolean;
  isToday: boolean;
  /** Point items closing that day. */
  items: CalItem[];
  markets: number;
}

export interface MonthWeek {
  start: number;
  cells: MonthCellModel[];
  lanes: SpanPlacement[][];
}

export const monthLabel = (monthStart: number): string =>
  new Date(monthStart).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

export const buildMonthWeeks = (
  items: CalItem[],
  monthStart: number,
  now: number = Date.now(),
): MonthWeek[] => {
  const todayKey = startOfDay(now);
  const first = new Date(monthStart);
  const gridStart = startOfDay(monthStart) - first.getDay() * DAY_MS;
  const weeks: MonthWeek[] = [];
  for (let w = 0; w < 6; w += 1) {
    const start = gridStart + w * WEEK_DAYS * DAY_MS;
    const cells: MonthCellModel[] = [];
    for (let d = 0; d < WEEK_DAYS; d += 1) {
      const key = start + d * DAY_MS;
      const date = new Date(key);
      const dayItems = closingOnDay(items, key);
      cells.push({
        key,
        day: date.getDate(),
        inMonth: startOfMonth(key) === startOfMonth(monthStart),
        isToday: key === todayKey,
        items: dayItems,
        markets: sumMarkets(dayItems),
      });
    }
    weeks.push({ start, cells, lanes: buildSpanLanes(items, start, WEEK_DAYS) });
  }
  return weeks;
};

/* ---------------- Category + sub-type filtering ---------------- */

/** The category row keeps filtering while the calendar lens is on. */
export const itemMatchesCategory = (item: CalItem, sector: string): boolean => {
  if (sector === "all" || sector === "watchlist") return true;
  if (sector === "sports") return item.kind === "sports";
  if (sector === "intraday") return item.kind === "session";
  // Finance folds the raw keys "finance" and "stocks" (taxonomy contract), so
  // stock closing-bell sessions belong to it too.
  if (sector === "finance" || sector === "stocks")
    return (
      item.kind === "session" ||
      (item.kind === "generic" && categoryMatchesTop(item.row.category, "finance"))
    );
  return (
    item.kind === "generic" && categoryMatchesTop(item.row.category, sector)
  );
};

/**
 * Sport group for a raw league string — resolved through the taxonomy
 * (src/lib/taxonomy.ts). No hardcoded league lists live here any more.
 */
export const sportForLeague = (league: string): string =>
  sportGroupFor(leagueCodeFor(league))?.label ?? "Other";

export interface SubTypeOption {
  id: string;
  label: string;
}

export interface SubTypeRow {
  /** Micro-label on the left of the row, e.g. "SPORTS". */
  micro: string;
  /** Broad sub-types (sport). */
  groups: SubTypeOption[];
  /** Leaf sub-types (league). */
  leaves: SubTypeOption[];
}

/**
 * Sub-type row. Visibility is data-driven (only leagues with live markets
 * render); ORDER and GROUPING come from the taxonomy.
 */
export const buildSportsSubTypes = (matches: SportsMatch[]): SubTypeRow => {
  const groupCodes = new Set<string>();
  const leagueCodes = new Set<string>();
  const unmapped = new Set<string>();
  for (const m of matches) {
    if (!m.league) continue;
    const code = leagueCodeFor(m.league);
    if (!code) {
      unmapped.add(m.league);
      continue;
    }
    leagueCodes.add(code);
    const g = sportGroupFor(code);
    if (g) groupCodes.add(g.code);
  }
  return {
    micro: "Sports",
    groups: SPORTS_GROUPS.filter((g) => groupCodes.has(g.code)).map((g) => ({
      id: `sport:${g.label}`,
      label: g.label,
    })),
    leaves: [
      ...ALL_LEAGUES.filter((l) => leagueCodes.has(l.code)).map((l) => ({
        id: `league:${l.code}`,
        label: l.label,
      })),
      // Anything outside the tree still gets a chip, parked at the end.
      ...[...unmapped].sort().map((l) => ({ id: `league:${l}`, label: l })),
    ],
  };
};

export const itemMatchesSubType = (item: CalItem, subType: string): boolean => {
  if (subType === "all") return true;
  if (item.kind !== "sports") return false;
  const [kind, value] = subType.split(":");
  if (kind === "league")
    return (leagueCodeFor(item.match.league) ?? item.match.league) === value;
  if (kind === "sport") return sportForLeague(item.match.league) === value;
  return true;
};

/* ---------------- Week columns ---------------- */

export interface WeekColumn {
  key: number;
  /** Small-caps column header, e.g. "TODAY" / "TUE 4 AUG". */
  label: string;
  /** Count line, e.g. "23 markets". */
  countLine: string;
  markets: number;
  items: CalItem[];
}

export const dayLabel = (key: number, todayKey: number): string => {
  if (key === todayKey) return "Today";
  const d = new Date(key);
  return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString(undefined, { month: "short" })}`;
};

export const buildWeekColumns = (
  items: CalItem[],
  now: number = Date.now(),
): WeekColumn[] => {
  const today = startOfDay(now);
  const cols: WeekColumn[] = [];
  for (let i = 0; i < WEEK_DAYS; i += 1) {
    const key = today + i * DAY_MS;
    const dayItems = closingOnDay(items, key);
    const markets = sumMarkets(dayItems);
    cols.push({
      key,
      label: dayLabel(key, today).toUpperCase(),
      countLine: `${markets} ${markets === 1 ? "market" : "markets"}`,
      markets,
      items: dayItems,
    });
  }
  return cols;
};

/* ---------------- Formatting ---------------- */

/** Local HH:mm, 24h, tabular. */
export const localTime = (d: Date): string =>
  d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** "16 Sep" — stamp used by the Later bucket, where the hour is noise. */
export const shortDate = (d: Date): string =>
  `${d.getDate()} ${d.toLocaleDateString(undefined, { month: "short" })}`;

/** "Closes 21:00" when it stops today, otherwise "Closes 30 Sep". */
export const closesStamp = (item: CalItem, now: number = Date.now()): string =>
  startOfDay(item.to) === startOfDay(now)
    ? `Closes ${localTime(item.to)}`
    : `Closes ${shortDate(item.to)}`;

/** "Today · Mon 3 Aug" / "Tue 4 Aug". */
export const stepperLabel = (key: number, todayKey: number): string => {
  const d = new Date(key);
  const stamp = `${d.toLocaleDateString(undefined, { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString(undefined, { month: "short" })}`;
  return key === todayKey ? `Today · ${stamp}` : stamp;
};

/** Decides within 24h. Never coloured — muted outlined text badge. */
export const closesSoon = (at: Date, now: number = Date.now()): boolean =>
  at.getTime() - now <= DAY_MS && at.getTime() > now;

export const compactUsd = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

export const centLabel = (price: number): string => `${Math.round(price * 100)}¢`;

/* ---------------- Ticket projection ---------------- */

/** Visual identity of a ticket's category token. Colour axis is fixed:
 *  orange belongs to Intraday only, chalk to Sports, everything else
 *  stays neutral — no per-category colour invention. */
export type TicketTone = "intraday" | "sports" | "neutral";

/** Long league names read like titles in a 7-column grid — short codes
 *  keep the category token scannable. Falls back to an initialism. */
const LEAGUE_SHORT: Record<string, string> = {
  "uefa champions league": "UCL",
  "uefa europa league": "UEL",
  "premier league": "EPL",
  "la liga": "LAL",
  "serie a": "SEA",
  bundesliga: "BUN",
  "ligue 1": "L1",
  csl: "CSL",
  "chinese super league": "CSL",
  "k league 1": "K1",
  ufc: "UFC",
  nba: "NBA",
  nfl: "NFL",
  mlb: "MLB",
};

export const leagueShortCode = (league: string): string => {
  const key = league.trim().toLowerCase();
  if (LEAGUE_SHORT[key]) return LEAGUE_SHORT[key];
  const initials = league
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return initials.slice(0, 4) || "SPORTS";
};

export interface TicketView {
  id: string;
  time: string;
  title: string;
  /** Short category token shown in the badge. */
  cat: string;
  tone: TicketTone;
  /** Secondary league code (sports only). */
  leagueShort: string | null;
  live: boolean;
  intraday: boolean;
  item: CalItem;
}

export const ticketOf = (
  item: CalItem,
  opts?: { asDate?: boolean },
): TicketView => {
  const time = opts?.asDate ? shortDate(item.at) : localTime(item.at);
  if (item.kind === "session")
    return {
      id: item.id,
      time,
      title: `${marketShortName(item.market)} closing bell`,
      cat: "Intraday",
      tone: "intraday",
      leagueShort: `${item.rows.length} ${marketShortName(item.market)} stocks`,
      live: false,
      intraday: true,
      item,
    };
  if (item.kind === "sports")
    return {
      id: item.id,
      time,
      title: item.match.name,
      cat: "Sports",
      tone: "sports",
      leagueShort: item.match.league ? leagueShortCode(item.match.league) : null,
      live: item.match.live,
      intraday: false,
      item,
    };
  return {
    id: item.id,
    time,
    title: item.row.eventName,
    cat: item.row.categoryLabel || item.row.category,
    tone: "neutral",
    leagueShort: null,
    live: false,
    intraday: false,
    item,
  };
};
