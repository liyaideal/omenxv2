// ============================================================
// SL-P · Pro terminal fixture market row — style-guide fixtures.
//
// Mounts the PRODUCTION `MarketLineRow` on a synthetic esports fixture
// (series lines + 3 maps) and a football fixture (Winner / Handicap /
// Total goals), built through the real `buildFixtureMarkets`.
// ============================================================
import { useState } from "react";
import { MarketLineRow } from "@/components/pro/MarketLineRow";
import type { EventOption, TradingEvent } from "@/hooks/useEvents";
import { buildFixtureMarkets } from "@/lib/fixtureMarkets";

const base = (id: string, name: string, extra: Partial<TradingEvent>): TradingEvent => ({
  id,
  name,
  icon: "",
  ends: "",
  endTime: new Date("2026-09-17T09:50:00Z"),
  period: "",
  volume: "$96.6K",
  description: "",
  rules: [],
  sourceUrl: "",
  sourceName: "",
  resolutionSource: "",
  productLines: ["futures"],
  ...extra,
});

const opts: Record<string, EventOption[]> = {};
const binary = (id: string, yes: number) => {
  opts[id] = [
    { id: `${id}-yes`, label: "Yes", price: yes.toFixed(4) },
    { id: `${id}-no`, label: "No", price: (1 - yes).toFixed(4) },
  ];
};

/* ---- esports fixture: Astralis vs Heroic (BO3) ---- */
const FX = "sg-cs2";
const esMeta = { sport: "esports", league: "IEM Cologne", home: "Astralis", away: "Heroic", home_abbr: "AST", away_abbr: "HER", segments_key: "IEM Cologne · BO3", segment_index: null };
const sib = (id: string, name: string, market_type: string, line: number | null, family: "main" | "seg", segment_index: number | null, yes: string, no: string, p: number) => {
  binary(id, p);
  return base(id, name, {
    sideLabels: { yes, no },
    metadata: { ...esMeta, fixture_id: FX, market_type, line, family, segment_index },
  });
};
binary(FX, 0.13);
export const ES_FIXTURE = base(FX, "Astralis vs Heroic", { sideLabels: { yes: "Astralis", no: "Heroic" }, metadata: { ...esMeta, fixture_id: FX, market_type: "winner" } });
export const ES_SIBLINGS: TradingEvent[] = [
  sib(`${FX}-maphcp-m2p5`, "AST vs Heroic — map handicap −2.5", "handicap", -2.5, "main", null, "AST −2.5", "HER +2.5", 0.18),
  sib(`${FX}-maphcp-m1p5`, "AST vs Heroic — map handicap −1.5", "handicap", -1.5, "main", null, "AST −1.5", "HER +1.5", 0.34),
  sib(`${FX}-maphcp-p1p5`, "AST vs Heroic — map handicap +1.5", "handicap", 1.5, "main", null, "AST +1.5", "HER −1.5", 0.71),
  sib(`${FX}-maptot-2p5`, "AST vs Heroic — maps over/under 2.5", "total", 2.5, "main", null, "Over 2.5", "Under 2.5", 0.65),
  ...[1, 2, 3].flatMap((n) => [
    sib(`${FX}-mapwin-${n}`, `AST vs Heroic — map ${n} winner`, "mapwin", null, "seg", n, "AST", "HER", 0.42),
    sib(`${FX}-m${n}-rhcp-m4p5`, `AST vs Heroic — M${n} round handicap −4.5`, "handicap", -4.5, "seg", n, "AST −4.5", "HER +4.5", 0.14),
    sib(`${FX}-m${n}-rhcp-m3p5`, `AST vs Heroic — M${n} round handicap −3.5`, "handicap", -3.5, "seg", n, "AST −3.5", "HER +3.5", 0.22),
    sib(`${FX}-m${n}-rtot-21p5`, `AST vs Heroic — M${n} rounds over/under 21.5`, "total", 21.5, "seg", n, "Over 21.5", "Under 21.5", 0.92),
    sib(`${FX}-m${n}-rtot-22p5`, `AST vs Heroic — M${n} rounds over/under 22.5`, "total", 22.5, "seg", n, "Over 22.5", "Under 22.5", 0.88),
  ]),
];

/* ---- football fixture: Arsenal v Liverpool ---- */
const FB = "sg-ars-liv";
const fbMeta = { sport: "football", league: "Premier League", home: "Arsenal", away: "Liverpool", home_abbr: "ARS", away_abbr: "LIV" };
const fsib = (id: string, market_type: string, line: number, yes: string, no: string, p: number) => {
  binary(id, p);
  return base(id, `Arsenal v Liverpool — ${market_type} ${line}`, { sideLabels: { yes, no }, metadata: { ...fbMeta, fixture_id: FB, market_type, line } });
};
opts[FB] = [
  { id: `${FB}-h`, label: "Arsenal", price: "0.4400" },
  { id: `${FB}-d`, label: "Draw", price: "0.2600" },
  { id: `${FB}-a`, label: "Liverpool", price: "0.3000" },
];
export const FB_FIXTURE = base(FB, "Arsenal v Liverpool", { metadata: { ...fbMeta, fixture_id: FB, market_type: "winner" } });
export const FB_SIBLINGS: TradingEvent[] = [
  fsib(`${FB}-hcp-m1p5`, "handicap", -1.5, "ARS −1.5", "LIV +1.5", 0.21),
  fsib(`${FB}-hcp-p1p5`, "handicap", 1.5, "ARS +1.5", "LIV −1.5", 0.83),
  fsib(`${FB}-tot-1p5`, "total", 1.5, "Over 1.5", "Under 1.5", 0.78),
  fsib(`${FB}-tot-2p5`, "total", 2.5, "Over 2.5", "Under 2.5", 0.52),
  fsib(`${FB}-tot-3p5`, "total", 3.5, "Over 3.5", "Under 3.5", 0.27),
];

const optionsOf = (id: string) => opts[id] ?? [];

const Row = ({
  fixture,
  siblings,
  initial,
  variant,
  open,
}: {
  fixture: TradingEvent;
  siblings: TradingEvent[];
  initial: string;
  variant: "desktop" | "mobile";
  open?: string;
}) => {
  const [current, setCurrent] = useState(initial);
  const markets = buildFixtureMarkets(fixture, [fixture], siblings, optionsOf)!;
  return (
    <div style={{ width: variant === "desktop" ? 1100 : 375 }}>
      <MarketLineRow markets={markets} currentId={current} onSelect={setCurrent} variant={variant} previewOpenGroup={open} />
    </div>
  );
};

/** SL-D1 · esports, on the series handicap line (AST −1.5). */
export const MarketRowEsports = () => <Row fixture={ES_FIXTURE} siblings={ES_SIBLINGS} initial={`${FX}-maphcp-m1p5`} variant="desktop" />;
/** SL-D2 · esports, Map 1 picker open (sections: winner / rounds handicap / total rounds). */
export const MarketRowEsportsOpen = () => <Row fixture={ES_FIXTURE} siblings={ES_SIBLINGS} initial={`${FX}-m1-rhcp-m3p5`} variant="desktop" open="grp-seg-1" />;
/** SL-D3 · football: Winner / Handicap / Total goals, on the winner. */
export const MarketRowFootball = () => <Row fixture={FB_FIXTURE} siblings={FB_SIBLINGS} initial={FB} variant="desktop" />;
/** SL-M1 · mobile row (375), esports, on the series handicap line. */
export const MarketRowMobile = () => <Row fixture={ES_FIXTURE} siblings={ES_SIBLINGS} initial={`${FX}-maphcp-m1p5`} variant="mobile" />;
/** SL-M2 · mobile picker drawer open (viewport-fixed — own frame). */
export const MarketRowMobileDrawer = () => (
  <div style={{ width: 375, height: 560 }}>
    <Row fixture={ES_FIXTURE} siblings={ES_SIBLINGS} initial={`${FX}-maphcp-m1p5`} variant="mobile" open="grp-series:h" />
  </div>
);
