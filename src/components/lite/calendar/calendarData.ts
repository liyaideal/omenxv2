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

/* ---------------- Items ---------------- */

interface CalBase {
  id: string;
  /** Decision moment, in absolute time. */
  at: Date;
}

export type CalItem =
  | (CalBase & { kind: "sports"; match: SportsMatch })
  | (CalBase & { kind: "session"; market: StockMarket; rows: StockEventRow[] })
  | (CalBase & { kind: "generic"; row: EventRow });

/** A stock session close carries N markets; everything else carries one. */
export const marketCountOf = (item: CalItem): number =>
  item.kind === "session" ? item.rows.length : 1;

/** "US" / "HK" — short market name used by the session copy. */
export const marketShortName = (market: StockMarket): string =>
  market.key === "hk" ? "HK" : "US";

export const sumMarkets = (items: CalItem[]): number =>
  items.reduce((n, i) => n + marketCountOf(i), 0);

export interface BuildInput {
  events: EventRow[];
  matches: SportsMatch[];
  stocks: StockEventRow[];
  now?: number;
}

/**
 * Every market with a concrete decision moment inside the 7-day window.
 * Rolling intraday crypto rounds are excluded by design — they live in
 * the standing orange row above the timeline.
 */
export const buildCalendarItems = ({
  events,
  matches,
  stocks,
  now = Date.now(),
}: BuildInput): CalItem[] => {
  const from = startOfDay(now);
  const to = from + WEEK_DAYS * DAY_MS;
  const inWindow = (t: number) => t >= from && t < to;
  const out: CalItem[] = [];

  // Generic events — settle time is the decision moment.
  for (const row of events) {
    if (!row.expiry) continue;
    if ((row.category || "").toLowerCase() === "sports") continue;
    if (
      row.eventSubtype &&
      (INTRADAY_SUBTYPES as readonly string[]).includes(row.eventSubtype)
    )
      continue;
    const t = row.expiry.getTime();
    if (t <= now || !inWindow(t)) continue;
    out.push({ kind: "generic", id: `g-${row.id}`, at: row.expiry, row });
  }

  // Sports — kickoff is the decision moment. Live matches stay listed.
  for (const m of matches) {
    if (!m.kickoff) continue;
    const t = m.kickoff.getTime();
    if (!inWindow(t)) continue;
    if (t <= now && !m.live) continue;
    out.push({ kind: "sports", id: `s-${m.id}`, at: m.kickoff, match: m });
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
    out.push({ kind: "session", id: `c-${key}`, at: b.at, market: b.market, rows: b.rows });
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
};

/* ---------------- Category + sub-type filtering ---------------- */

/** The category row keeps filtering while the calendar lens is on. */
export const itemMatchesCategory = (item: CalItem, sector: string): boolean => {
  if (sector === "all" || sector === "watchlist") return true;
  if (sector === "sports") return item.kind === "sports";
  if (sector === "intraday") return item.kind === "session";
  if (sector === "stocks")
    return (
      item.kind === "session" ||
      (item.kind === "generic" && (item.row.category || "").toLowerCase() === "stocks")
    );
  return (
    item.kind === "generic" && (item.row.category || "").toLowerCase() === sector
  );
};

/** UFC is the only MMA league in the seed set; everything else is football. */
export const sportForLeague = (league: string): string =>
  /ufc|mma/i.test(league) ? "MMA" : "Football";

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

/** Data-driven sub-type row. Generic shape; wired for Sports this round. */
export const buildSportsSubTypes = (matches: SportsMatch[]): SubTypeRow => {
  const sports = new Set<string>();
  const leagues = new Set<string>();
  for (const m of matches) {
    if (!m.league) continue;
    leagues.add(m.league);
    sports.add(sportForLeague(m.league));
  }
  return {
    micro: "Sports",
    groups: [...sports].sort().map((s) => ({ id: `sport:${s}`, label: s })),
    leaves: [...leagues].sort().map((l) => ({ id: `league:${l}`, label: l })),
  };
};

export const itemMatchesSubType = (item: CalItem, subType: string): boolean => {
  if (subType === "all") return true;
  if (item.kind !== "sports") return false;
  const [kind, value] = subType.split(":");
  if (kind === "league") return item.match.league === value;
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
    const dayItems = items.filter((it) => startOfDay(it.at) === key);
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

/** Viewer's own timezone abbreviation — the contract sample shows ET. */
export const userTzAbbrev = (): string => {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
};

/** Local HH:mm, 24h, tabular. */
export const localTime = (d: Date): string =>
  d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

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

export const ticketOf = (item: CalItem): TicketView => {
  const time = localTime(item.at);
  if (item.kind === "session")
    return {
      id: item.id,
      time,
      title: `${marketShortName(item.market)} session close`,
      cat: `${item.rows.length} ${marketShortName(item.market)} closes`,
      tone: "intraday",
      leagueShort: null,
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
