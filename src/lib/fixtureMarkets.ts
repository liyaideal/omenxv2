// ============================================================
// SL-P · Fixture market model for the Pro terminal market row.
//
// A sports fixture is 1 Winner event + N sibling events (handicap / total /
// mapwin / method / distance) sharing `metadata.fixture_id`. Lite renders
// them as a board; Pro renders one horizontal row of groups, each group a
// chip with (optionally) a dropdown of lines. Selecting a line = switching
// the whole terminal to that sibling event.
//
// Group nouns follow the Lite board (Winner / Handicap / Total goals /
// Total maps / Map n · Rounds handicap …). Spread / Totals / O/U stay banned.
// ============================================================
import type { EventOption, TradingEvent } from "@/hooks/useEvents";
import {
  fixtureMeta,
  formatSignedLine,
  groupFixtureMarkets,
  groupSegmentedMarkets,
  scoringNoun,
} from "@/components/lite/sports/sportsData";

export interface MarketSide {
  label: string;
  /** Option price as a decimal string ("0.3400"); "—" when unknown. */
  price: string;
  optionId: string | null;
}

export interface MarketLine {
  /** Sibling (or winner) event id — what the terminal switches to. */
  id: string;
  /** Row text in the dropdown: "AST −1.5 / HER +1.5", "Over 2.5 / Under 2.5". */
  label: string;
  /** Short text for the chip when this line is the current one: "AST −1.5". */
  short: string;
  /** Header subline: "Map handicap · AST −1.5". */
  caption: string;
  yes: MarketSide;
  no: MarketSide;
  /** One outcome of a multi-way winner (Home / Draw / Away): one price, selects an option instead of switching event. */
  single?: boolean;
}

export interface MarketSection {
  title: string;
  lines: MarketLine[];
}

export interface MarketGroup {
  key: string;
  /** Chip caption: Winner / Handicap / Total goals / Map 1 … */
  title: string;
  sections: MarketSection[];
  /** Line shown on the chip while the group is not the current one. */
  defaultId: string;
}

export interface FixtureMarkets {
  /** The Winner event — owns the header title. */
  fixture: TradingEvent;
  groups: MarketGroup[];
  /** Every line by event id. */
  byId: Map<string, { group: MarketGroup; line: MarketLine }>;
}

/** Fixture id an event belongs to: its own id for a winner, `metadata.fixture_id` for a sibling. */
export const fixtureIdOf = (event: TradingEvent | null | undefined): string | null => {
  if (!event) return null;
  const meta = fixtureMeta(event);
  return meta.fixture_id ?? null;
};

export const isSiblingEvent = (event: TradingEvent | null | undefined): boolean => {
  const mt = fixtureMeta(event).market_type;
  return !!mt && mt !== "winner";
};

const cents = (price: string) => {
  const n = parseFloat(price);
  return Number.isFinite(n) ? `${Math.round(n * 100)}¢` : "—";
};

/** "34¢" for a decimal price string. */
export const priceCents = cents;

/**
 * Line ids are event ids, except the outcomes of a multi-way winner
 * (Home / Draw / Away), which are `<eventId>#<optionId>` — picking one keeps
 * the terminal on the winner event and selects that option.
 */
export const outcomeLineId = (eventId: string, optionId: string) => `${eventId}#${optionId}`;
export const parseLineId = (lineId: string): { eventId: string; optionId?: string } => {
  const i = lineId.indexOf("#");
  return i < 0 ? { eventId: lineId } : { eventId: lineId.slice(0, i), optionId: lineId.slice(i + 1) };
};
/** The row's current line for the terminal state (event + selected option). */
export const currentLineId = (markets: FixtureMarkets | null, eventId: string, optionId: string | null | undefined): string => {
  if (markets && optionId && markets.byId.has(outcomeLineId(eventId, optionId))) return outcomeLineId(eventId, optionId);
  return eventId;
};

type OptionsOf = (eventId: string) => EventOption[];

/** Yes / No sides of a binary event with its side-label aliases applied. */
const sidesOf = (ev: TradingEvent, optionsOf: OptionsOf): { yes: MarketSide; no: MarketSide } => {
  const opts = optionsOf(ev.id);
  const norm = (s: string) => s.trim().toLowerCase();
  const yesAlias = ev.sideLabels?.yes ?? "Yes";
  const noAlias = ev.sideLabels?.no ?? "No";
  const yesOpt =
    opts.find((o) => norm(o.label) === "yes") ??
    opts.find((o) => norm(o.label) === norm(yesAlias)) ??
    opts[0];
  const noOpt =
    opts.find((o) => norm(o.label) === "no") ??
    opts.find((o) => norm(o.label) === norm(noAlias)) ??
    opts.find((o) => o.id !== yesOpt?.id) ??
    opts[1];
  // No alias configured → the option's own label (a football winner's first
  // option is "Arsenal", not "Yes").
  const yesLabel = ev.sideLabels?.yes ?? yesOpt?.label ?? "Yes";
  const noLabel = ev.sideLabels?.no ?? noOpt?.label ?? "No";
  return {
    yes: { label: yesLabel, price: yesOpt?.price ?? "—", optionId: yesOpt?.id ?? null },
    no: { label: noLabel, price: noOpt?.price ?? "—", optionId: noOpt?.id ?? null },
  };
};

const median = <T,>(xs: T[]): T | undefined => xs[Math.floor(xs.length / 2)];

/**
 * Build the market row for the fixture an event belongs to. Returns null for
 * events that are neither a fixture winner with siblings nor a sibling.
 */
export const buildFixtureMarkets = (
  event: TradingEvent | null | undefined,
  allEvents: TradingEvent[],
  siblings: TradingEvent[],
  optionsOf: OptionsOf,
): FixtureMarkets | null => {
  if (!event) return null;
  const fixtureId = fixtureIdOf(event) ?? event.id;
  const fixture = event.id === fixtureId ? event : allEvents.find((e) => e.id === fixtureId);
  if (!fixture) return null;
  const sibs = siblings.filter((s) => fixtureIdOf(s) === fixtureId);
  if (sibs.length === 0) return null;

  const meta = fixtureMeta(fixture);
  const homeAbbr = meta.home_abbr || meta.home || "Home";
  const sport = (meta.sport || "").toLowerCase();

  const lineOf = (
    ev: TradingEvent,
    kind: "winner" | "handicap" | "total" | "mapwin" | "method" | "distance",
    captionPrefix: string,
    /** Chip prefix inside multi-section groups (Map n): "Rounds handicap" / "Total rounds". */
    shortPrefix?: string,
  ): MarketLine => {
    const s = sidesOf(ev, optionsOf);
    const l = fixtureMeta(ev).line;
    let short: string;
    let caption: string;
    switch (kind) {
      case "handicap":
        short = `${homeAbbr} ${formatSignedLine(l ?? 0)}`;
        caption = `${captionPrefix} · ${short}`;
        if (shortPrefix) short = `${shortPrefix} ${short}`;
        break;
      case "total":
        short = `Over ${l ?? ""}`.trim();
        caption = `${captionPrefix} · ${short}`;
        if (shortPrefix) short = `${shortPrefix} ${short}`;
        break;
      case "winner":
        short = s.yes.label;
        caption = captionPrefix;
        break;
      case "mapwin":
        short = s.yes.label;
        caption = captionPrefix;
        break;
      default:
        short = ev.name;
        caption = ev.name;
    }
    return { id: ev.id, label: `${s.yes.label} / ${s.no.label}`, short, caption, yes: s.yes, no: s.no };
  };

  const groups: MarketGroup[] = [];
  const push = (key: string, title: string, sections: MarketSection[], defaultId?: string) => {
    const nonEmpty = sections.filter((sec) => sec.lines.length > 0);
    if (nonEmpty.length === 0) return;
    const def = defaultId ?? median(nonEmpty[0].lines)?.id ?? nonEmpty[0].lines[0].id;
    groups.push({ key, title, sections: nonEmpty, defaultId: def });
  };

  if (meta.segments_key && (sport === "esports" || sport === "mma")) {
    const segGroups = groupSegmentedMarkets(fixture, sibs, meta.segment_index ?? null);
    for (const g of segGroups) {
      const isSeries = g.key === "grp-series" || g.key === "grp-fight";
      if (isSeries) {
        if (g.winner) push(`${g.key}:w`, "Winner", [{ title: sport === "mma" ? "Fight winner" : "Match winner", lines: [lineOf(g.winner, "winner", sport === "mma" ? "Fight winner" : "Match winner")] }], g.winner.id);
        if (g.handicap.length) push(`${g.key}:h`, "Handicap", [{ title: "Map handicap", lines: g.handicap.map((e) => lineOf(e, "handicap", "Map handicap")) }]);
        if (g.total.length) push(`${g.key}:t`, sport === "mma" ? "Total rounds" : "Total maps", [{ title: sport === "mma" ? "Total rounds" : "Total maps", lines: g.total.map((e) => lineOf(e, "total", sport === "mma" ? "Total rounds" : "Total maps")) }]);
      } else if (g.key === "grp-method") {
        const sections: MarketSection[] = [];
        if (g.method.length) sections.push({ title: "Method", lines: g.method.map((e) => lineOf(e, "method", e.name)) });
        if (g.distance) sections.push({ title: "Distance", lines: [lineOf(g.distance, "distance", g.distance.name)] });
        push(g.key, "Method", sections);
      } else {
        // Map n
        const n = g.segmentIndex ?? 0;
        const sections: MarketSection[] = [];
        const mapwin = sibs.find((e) => fixtureMeta(e).market_type === "mapwin" && e.id.endsWith(`-mapwin-${n}`));
        if (mapwin) sections.push({ title: `Map ${n} winner`, lines: [{ ...lineOf(mapwin, "mapwin", `Map ${n} winner`), short: `Winner ${sidesOf(mapwin, optionsOf).yes.label}` }] });
        if (g.handicap.length) sections.push({ title: `Map ${n} · Rounds handicap`, lines: g.handicap.map((e) => lineOf(e, "handicap", `Map ${n} · Rounds handicap`, "Rounds handicap")) });
        if (g.total.length) sections.push({ title: `Map ${n} · Total rounds`, lines: g.total.map((e) => lineOf(e, "total", `Map ${n} · Total rounds`, "Total rounds")) });
        push(g.key, g.title, sections, mapwin?.id);
      }
    }
  } else {
    const fm = groupFixtureMarkets([fixture, ...sibs]);
    const noun = scoringNoun(meta);
    const winnerOpts = optionsOf(fixture.id);
    if (winnerOpts.length > 2) {
      // Home / Draw / Away: one line per outcome, selecting an option of the winner event.
      const lines: MarketLine[] = winnerOpts.map((o) => ({
        id: outcomeLineId(fixture.id, o.id),
        label: o.label,
        short: o.label,
        caption: "Winner",
        yes: { label: o.label, price: o.price, optionId: o.id },
        no: { label: "", price: "—", optionId: null },
        single: true,
      }));
      push("winner", "Winner", [{ title: "Winner", lines }], lines[0].id);
    } else {
      push("winner", "Winner", [{ title: "Winner", lines: [lineOf(fixture, "winner", "Winner")] }], fixture.id);
    }
    if (fm.handicap.length) push("handicap", "Handicap", [{ title: "Handicap", lines: fm.handicap.map((e) => lineOf(e, "handicap", "Handicap")) }]);
    if (fm.total.length) push("total", `Total ${noun}`, [{ title: `Total ${noun}`, lines: fm.total.map((e) => lineOf(e, "total", `Total ${noun}`)) }]);
  }

  const byId = new Map<string, { group: MarketGroup; line: MarketLine }>();
  for (const group of groups) for (const sec of group.sections) for (const line of sec.lines) byId.set(line.id, { group, line });
  return { fixture, groups, byId };
};

/** Terminal URL for a line of a fixture: winner → `?event=<fixture>`, sibling → `?event=<fixture>&line=<id>`. */
export const fixtureLinePath = (base: "/trade" | "/trade/order", fixtureId: string, lineId: string): string =>
  lineId === fixtureId
    ? `${base}?event=${encodeURIComponent(fixtureId)}`
    : `${base}?event=${encodeURIComponent(fixtureId)}&line=${encodeURIComponent(lineId)}`;
