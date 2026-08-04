// ============================================================
// EVENT TAXONOMY — single source of truth (CPO document, phase A).
//
// Everything that renders a category chip, a sub-type row or a group
// header reads its ORDER and GROUPING from here. Visibility stays
// data-driven: a node renders only when live markets exist for it.
//
// Human-readable mirror: docs/taxonomy.md (keep in lockstep).
//
// NAMING RULE: "Props" is an INTERNAL bucket name only. It must never
// appear in rendered Lite UI (same class as the "Moneyline" ban) —
// vertical pages use question-style section titles instead.
// ============================================================

export type TopCategoryKind = "all" | "view" | "sector";

export interface TopCategory {
  /** Stable UI id (also the sector filter value). */
  id: string;
  /** Rendered chip label on the Lite surface. */
  label: string;
  kind: TopCategoryKind;
  /** Sector dot colour, when the chip carries one. */
  dot?: string;
  /**
   * Raw `events.category` DB keys folded into this chip. Empty for
   * pure views (Intraday is a subtype band, not a category key).
   * No data migration: the key→display mapping lives here.
   */
  keys: string[];
}

/** Top level, in CPO order. Generic categories keep their chips after Economy. */
export const TOP_CATEGORIES: TopCategory[] = [
  { id: "all", label: "All", kind: "all", keys: [] },
  { id: "intraday", label: "Intraday", kind: "view", dot: "#FF8A3D", keys: [] },
  { id: "sports", label: "Sports", kind: "view", dot: "#F2F3F5", keys: ["sports"] },
  { id: "crypto", label: "Crypto", kind: "sector", keys: ["crypto"] },
  // Finance REPLACES the old top-level "Stocks" chip. "Stocks" survives as an
  // asset-class leaf below. Internal keys stay untouched.
  { id: "finance", label: "Finance", kind: "sector", keys: ["finance", "stocks"] },
  { id: "politics", label: "Politics", kind: "sector", keys: ["politics"] },
  { id: "macro", label: "Economy", kind: "sector", keys: ["macro"] },
  { id: "tech", label: "Tech", kind: "sector", keys: ["tech"] },
  { id: "entertainment", label: "Entertainment", kind: "sector", keys: ["entertainment"] },
  { id: "social", label: "Social", kind: "sector", keys: ["social"] },
];

/** Boost is a filter, not a category — it sits after the divider. */
export const BOOST_FILTER = { id: "boost", label: "Boost" } as const;

/** Sector chips only (no All, no pure views). */
export const SECTOR_CATEGORIES = TOP_CATEGORIES.filter((c) => c.kind === "sector");

const KEY_TO_TOP = new Map<string, TopCategory>();
for (const c of TOP_CATEGORIES) for (const k of c.keys) KEY_TO_TOP.set(k, c);

/** Raw DB category key → top-level node (undefined when unmapped). */
export const topCategoryForKey = (key: string | null | undefined) =>
  KEY_TO_TOP.get((key || "").toLowerCase());

/** Raw DB category key → rendered label ("stocks" → "Finance"). */
export const categoryLabelForKey = (key: string | null | undefined): string =>
  topCategoryForKey(key)?.label ?? "Other";

/** Does an event of `key` belong under the selected top-level chip? */
export const categoryMatchesTop = (
  key: string | null | undefined,
  topId: string,
): boolean => {
  if (topId === "all") return true;
  return topCategoryForKey(key)?.id === topId;
};

/** Taxonomy order index for grouping headers; unmapped sinks to the end. */
export const topCategoryOrder = (topId: string): number => {
  const i = TOP_CATEGORIES.findIndex((c) => c.id === topId);
  return i < 0 ? TOP_CATEGORIES.length : i;
};

// ---------------------------------------------------------------- Sports

export interface LeagueNode {
  /** Stable taxonomy code, e.g. "UCL". */
  code: string;
  /** Rendered label. */
  label: string;
  /**
   * Data-model-only parent (e.g. LPL/LCK → League of Legends). NEVER
   * rendered: Esports is flattened to two levels in ALL UI.
   */
  parent?: string;
  /** Match patterns against the raw `metadata.league` string. */
  aliases?: RegExp[];
}

export interface SportGroup {
  code: string;
  label: string;
  leagues: LeagueNode[];
}

export const SPORTS_GROUPS: SportGroup[] = [
  {
    code: "SOCCER",
    label: "Soccer",
    leagues: [
      { code: "WORLD_CUP", label: "World Cup", aliases: [/world cup/i] },
      {
        code: "UCL",
        label: "UEFA Champions League",
        aliases: [/champions league/i, /\bucl\b/i],
      },
      { code: "EPL", label: "Premier League", aliases: [/premier league/i, /\bepl\b/i] },
      { code: "LALIGA", label: "LaLiga", aliases: [/la ?liga/i] },
      { code: "SERIE_A", label: "Serie A", aliases: [/serie a/i] },
      { code: "BUNDESLIGA", label: "Bundesliga", aliases: [/bundesliga/i] },
      { code: "LIGUE_1", label: "Ligue 1", aliases: [/ligue 1/i] },
      { code: "CSL", label: "Chinese Super League", aliases: [/chinese super/i, /\bcsl\b/i] },
      { code: "K_LEAGUE_1", label: "K League 1", aliases: [/k ?league/i] },
    ],
  },
  { code: "BASKETBALL", label: "Basketball", leagues: [
    { code: "NBA", label: "NBA", aliases: [/\bnba\b/i] },
  ] },
  { code: "TENNIS", label: "Tennis", leagues: [
    { code: "ATP", label: "ATP", aliases: [/\batp\b/i] },
    { code: "WTA", label: "WTA", aliases: [/\bwta\b/i] },
  ] },
  { code: "UFC", label: "UFC", leagues: [
    { code: "UFC", label: "UFC", aliases: [/\bufc\b/i, /\bmma\b/i] },
  ] },
  { code: "NFL", label: "NFL", leagues: [
    { code: "NFL", label: "NFL", aliases: [/\bnfl\b/i] },
  ] },
  {
    code: "ESPORTS",
    label: "Esports",
    leagues: [
      // parent is data-model only — never rendered as a third level.
      { code: "LPL", label: "LPL", parent: "LOL", aliases: [/\blpl\b/i] },
      { code: "LCK", label: "LCK", parent: "LOL", aliases: [/\blck\b/i] },
      { code: "DOTA2", label: "Dota 2", aliases: [/dota/i] },
      { code: "CS2", label: "CS 2", aliases: [/\bcs ?2\b/i, /counter-?strike/i] },
    ],
  },
];

export const ALL_LEAGUES: LeagueNode[] = SPORTS_GROUPS.flatMap((g) => g.leagues);

const LEAGUE_GROUP = new Map<string, SportGroup>();
for (const g of SPORTS_GROUPS) for (const l of g.leagues) LEAGUE_GROUP.set(l.code, g);

/** Raw `metadata.league` string → taxonomy league code (null when unknown). */
export const leagueCodeFor = (raw: string | null | undefined): string | null => {
  const s = (raw || "").trim();
  if (!s) return null;
  for (const l of ALL_LEAGUES) {
    if (l.code.toLowerCase() === s.toLowerCase()) return l.code;
    if (l.label.toLowerCase() === s.toLowerCase()) return l.code;
    if (l.aliases?.some((re) => re.test(s))) return l.code;
  }
  return null;
};

export const leagueNode = (code: string | null): LeagueNode | undefined =>
  code ? ALL_LEAGUES.find((l) => l.code === code) : undefined;

export const leagueLabel = (code: string | null, fallback = ""): string =>
  leagueNode(code)?.label ?? fallback;

/** Sport group for a league code (e.g. "EPL" → Soccer). */
export const sportGroupFor = (code: string | null): SportGroup | undefined =>
  code ? LEAGUE_GROUP.get(code) : undefined;

/** Taxonomy order of a league across the whole tree. */
export const leagueOrder = (code: string | null): number => {
  const i = ALL_LEAGUES.findIndex((l) => l.code === code);
  return i < 0 ? ALL_LEAGUES.length : i;
};

export const sportGroupOrder = (groupCode: string | undefined): number => {
  const i = SPORTS_GROUPS.findIndex((g) => g.code === groupCode);
  return i < 0 ? SPORTS_GROUPS.length : i;
};

// ---------------------------------------------------------------- Crypto

export const CRYPTO_TIMEFRAMES = [
  { code: "5m", label: "5m" },
  { code: "15m", label: "15m" },
  { code: "1h", label: "1h" },
  { code: "4h", label: "4h" },
  { code: "1d", label: "Daily" },
] as const;

export const CRYPTO_COINS = [
  { code: "btc", label: "BTC" },
  { code: "eth", label: "ETH" },
  { code: "sol", label: "SOL" },
] as const;

// ---------------------------------------------------------------- Finance

export const FINANCE_ASSET_CLASSES = [
  { code: "indices", label: "Indices" },
  { code: "stocks", label: "Stocks" },
  { code: "commodities", label: "Commodities" },
  { code: "fx", label: "FX" },
] as const;

export const FINANCE_REGIONS = [
  { code: "us", label: "US" },
  { code: "hk", label: "Hong Kong / China" },
  { code: "kr", label: "Korea" },
] as const;

// ---------------------------------------------------------------- Props

/**
 * Every vertical also has a props bucket — its non-intraday event
 * catalogue. INTERNAL NAME ONLY. Never render this string.
 */
export const PROPS_BUCKET = "props" as const;

/** Verticals that carry a props bucket. */
export const PROPS_VERTICALS = ["sports", "crypto", "finance"] as const;
