// ============================================================
// Sports game lines — production components only (LiteMarketBoard +
// LiteLineScrubber + LiteBoardGroupHeader), mounted the same way the
// fixture board in LiteContractTrade mounts them. Props are mock data;
// the components are the production branch.
// ============================================================
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LiteMarketBoard, type BoardOption } from "@/components/lite/multi/LiteMarketBoard";
import { LiteLineScrubber } from "@/components/lite/multi/LiteLineScrubber";
import { LiteBoardGroupHeader } from "@/components/lite/multi/LiteBoardGroupHeader";
import { LitePositionCard } from "@/components/lite/contract/LitePositionCard";
import { TradeRuleCard } from "@/components/lite/contract/LiteTradeBlocks";
import {
  formatSignedLine,
  groupSegmentedMarkets,
} from "@/components/lite/sports/sportsData";
import {
  buildModel,
  type MatchboardEvent,
} from "@/components/lite/sports/matchboardModel";
import { boardGroupAnnotation } from "@/pages/lite/LiteContractTrade";

const REG_TIP =
  "Settles on the regulation-time result. Extra time and penalties don't count.";
const VOL = "Vol $550.1K";

const WINNER_ROWS: BoardOption[] = [
  { id: "w-ars", label: "Arsenal", yesPrice: 0.47 },
  { id: "w-draw", label: "Draw", yesPrice: 0.26 },
  { id: "w-liv", label: "Liverpool", yesPrice: 0.27 },
];

const HCP_LINES = [-2.5, -1.5, 1.5, 2.5];
const HCP_PRICE: Record<number, number> = { [-2.5]: 0.06, [-1.5]: 0.13, 1.5: 0.87, 2.5: 0.94 };
const TOT_LINES = [0.5, 1.5, 2.5, 3.5, 4.5];
const TOT_PRICE: Record<number, number> = {
  0.5: 0.93,
  1.5: 0.8,
  2.5: 0.58,
  3.5: 0.34,
  4.5: 0.1,
};

const hcpRow = (line: number, settled = false, held = false): BoardOption => ({
  id: `hcp-${line}`,
  label: `ARS ${formatSignedLine(line)} covers`,
  yesPrice: HCP_PRICE[line],
  yesChipLabel: `ARS ${formatSignedLine(line)}`,
  noChipLabel: `LIV ${formatSignedLine(-line)}`,
  settled,
  // Side-labelled leg: the side word IS the side label, never "Yes".
  heldSide: held ? "yes" : null,
  heldSideLabel: held ? `ARS ${formatSignedLine(line)}` : null,
});

const totRow = (line: number): BoardOption => ({
  id: `tot-${line}`,
  label: `Over ${line} goals`,
  yesPrice: TOT_PRICE[line],
  yesChipLabel: `Over ${line}`,
  noChipLabel: `Under ${line}`,
});

/** The full fixture board, exactly as the trade page composes it. */
const FixtureBoard = ({
  selectedId = null,
  selectedSide = "yes",
  initialHandicap = 1.5,
  totalsSingleLine = false,
  winnerSettled = false,
  handicapHeld = false,
}: {
  selectedId?: string | null;
  selectedSide?: "yes" | "no";
  initialHandicap?: number;
  totalsSingleLine?: boolean;
  winnerSettled?: boolean;
  handicapHeld?: boolean;
}) => {
  const isMobile = useIsMobile();
  const [hcp, setHcp] = useState(initialHandicap);
  const [tot, setTot] = useState(2.5);
  const [sel, setSel] = useState<string | null>(selectedId);
  const [side, setSide] = useState<"yes" | "no">(selectedSide);
  const pick = (id: string, s: "yes" | "no") => {
    setSel(id);
    setSide(s);
  };
  const totalLines = totalsSingleLine ? [2.5] : TOT_LINES;

  return (
    <div className="space-y-2 bg-[#0A0B0D] p-4">
      <LiteBoardGroupHeader title="Winner" note="Regulation time" tip={REG_TIP} />
      <LiteMarketBoard
        options={WINNER_ROWS.map((o) => ({
          ...o,
          settled: winnerSettled,
          outcomeYes: winnerSettled && o.id === "w-ars",
        }))}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={pick}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
      />
      <LiteBoardGroupHeader
        title="Handicap"
        note="Regulation time"
        tip={`A team covers when its regulation-time score plus the line beats the opponent. ${REG_TIP}`}
      />
      <LiteMarketBoard
        options={[hcpRow(hcp, false, handicapHeld)]}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={pick}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
        renderFooter={() => (
          <LiteLineScrubber
            values={HCP_LINES}
            value={hcp}
            onChange={setHcp}
            compact={!!isMobile}
          />
        )}
      />
      <LiteBoardGroupHeader
        title="Total goals"
        note="Regulation time"
        tip={`Counts both teams' goals in regulation time. ${REG_TIP}`}
      />
      <LiteMarketBoard
        options={[totRow(totalsSingleLine ? 2.5 : tot)]}
        volumeText={VOL}
        selectedId={sel}
        selectedSide={side}
        onSelect={pick}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
        renderFooter={() => (
          <LiteLineScrubber
            values={totalLines}
            value={tot}
            onChange={setTot}
            format={(n) => String(n)}
            compact={!!isMobile}
          />
        )}
      />
      {handicapHeld && (
        // Production MultiPositions wrapper — no eyebrow header.
        <div className="space-y-3">
          {/* 1× carries no Boost suffix — the title is the side label alone. */}
          <LitePositionCard
            sideLabel={`ARS ${formatSignedLine(hcp)}`}
            isYes
            boost={1}
            putIn={25}
            nowWorth={31.4}
            profit={6.4}
            autoCloseText="None"
            compact={!!isMobile}
            onCashOut={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export const SportsLinesDefaultPreview = () => <FixtureBoard />;

export const SportsLinesHandicapSelectedPreview = () => (
  <FixtureBoard selectedId="hcp-1.5" selectedSide="yes" handicapHeld />
);

export const SportsLinesScrubbedPreview = () => <FixtureBoard initialHandicap={-2.5} />;

export const SportsLinesSingleLinePreview = () => <FixtureBoard totalsSingleLine />;

export const SportsLinesSettledPreview = () => <FixtureBoard winnerSettled />;

/** Standalone scrubber: compact + desktop widths, both at an edge. */
export const LineScrubberPreview = () => {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(0.5);
  return (
    <div className="space-y-6 bg-[#0A0B0D] p-4">
      <div className="rounded-xl border border-border bg-card px-4 pb-2.5 pt-3">
        <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Desktop · 6 values
        </div>
        <LiteLineScrubber values={HCP_LINES} value={a} onChange={setA} />
      </div>
      <div className="rounded-xl border border-border bg-card px-3 pb-2.5 pt-3">
        <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Compact · 4-value window at the left edge
        </div>
        <LiteLineScrubber
          values={TOT_LINES}
          value={b}
          onChange={setB}
          format={(n) => String(n)}
          compact
        />
      </div>
    </div>
  );
};

// ============================================================
// TR-25 / TR-26 — segmented boards (esports maps / MMA method).
// Production components only; the grouping comes from the production
// `groupSegmentedMarkets()` and the group annotations from the
// production `boardGroupAnnotation()` — no third implementation.
// Prices are frozen constants; the clock is a frozen constant too.
// ============================================================

const SG_NOW = Date.parse("2026-09-01T11:00:00Z");
const SG_START = "2026-09-01T10:00:00Z";
const SG_END = "2026-09-01T14:00:00Z";

interface SgRow {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
}

const SG_PRICE: Record<string, number> = {
  "sg-cs2": 0.62,
  "sg-cs2-mapwin-2": 0.55,
  "sg-cs2-maphcp-m1p5": 0.41,
  "sg-cs2-maptot-2p5": 0.58,
  "sg-cs2-seg1-hcp-m4p5": 0.36,
  "sg-cs2-seg1-hcp-m3p5": 0.44,
  "sg-cs2-seg1-tot-21p5": 0.52,
  "sg-cs2-seg1-tot-22p5": 0.47,
  "sg-cs2-seg2-hcp-m4p5": 0.33,
  "sg-cs2-seg2-hcp-m3p5": 0.42,
  "sg-cs2-seg2-tot-21p5": 0.56,
  "sg-cs2-seg2-tot-22p5": 0.49,
  "sg-cs2-seg3-hcp-m4p5": 0.31,
  "sg-cs2-seg3-hcp-m3p5": 0.4,
  "sg-cs2-seg3-tot-21p5": 0.54,
  "sg-cs2-seg3-tot-22p5": 0.46,
  "sg-ufc": 0.57,
  "sg-ufc-tot-1p5": 0.81,
  "sg-ufc-tot-2p5": 0.63,
  "sg-ufc-tot-3p5": 0.38,
  "sg-ufc-method-ko": 0.44,
  "sg-ufc-method-sub": 0.12,
  "sg-ufc-dist": 0.34,
};

const CS2_FIXTURE: SgRow = {
  id: "sg-cs2",
  name: "Spirit vs MOUZ",
  metadata: {
    sport: "esports",
    segments_key: "IEM Cologne · BO3",
    league: "IEM Cologne",
    home: "Spirit",
    away: "MOUZ",
    home_abbr: "SPIRIT",
    away_abbr: "MOUZ",
    format: "h2h",
    segment_index: 2,
    segment_results: [{ home: 13, away: 8 }, { home: 6, away: 4 }, null],
  },
};

const CS2_SIBLINGS: SgRow[] = [
  {
    id: "sg-cs2-maphcp-m1p5",
    name: "Map handicap",
    metadata: { fixture_id: "sg-cs2", market_type: "handicap", line: -1.5, family: "main" },
  },
  {
    id: "sg-cs2-maptot-2p5",
    name: "Total maps",
    metadata: { fixture_id: "sg-cs2", market_type: "total", line: 2.5, family: "main" },
  },
  ...[1, 2, 3].map((n) => ({
    id: `sg-cs2-mapwin-${n}`,
    name: `Map ${n} winner`,
    metadata: { fixture_id: "sg-cs2", market_type: "mapwin", family: "main", segment_index: n },
  })),
  ...[1, 2, 3].flatMap((n) => [
    {
      id: `sg-cs2-seg${n}-hcp-m4p5`,
      name: "Rounds handicap",
      metadata: { fixture_id: "sg-cs2", market_type: "handicap", line: -4.5, family: "seg", segment_index: n },
    },
    {
      id: `sg-cs2-seg${n}-hcp-m3p5`,
      name: "Rounds handicap",
      metadata: { fixture_id: "sg-cs2", market_type: "handicap", line: -3.5, family: "seg", segment_index: n },
    },
    {
      id: `sg-cs2-seg${n}-tot-21p5`,
      name: "Total rounds",
      metadata: { fixture_id: "sg-cs2", market_type: "total", line: 21.5, family: "seg", segment_index: n },
    },
    {
      id: `sg-cs2-seg${n}-tot-22p5`,
      name: "Total rounds",
      metadata: { fixture_id: "sg-cs2", market_type: "total", line: 22.5, family: "seg", segment_index: n },
    },
  ]),
];

const UFC_FIXTURE: SgRow = {
  id: "sg-ufc",
  name: "Alex Pereira vs Magomed Ankalaev",
  metadata: {
    sport: "mma",
    segments_key: "UFC · main",
    league: "UFC 321",
    home: "Alex Pereira",
    away: "Magomed Ankalaev",
    format: "h2h",
    segment_index: null,
    segment_results: null,
  },
};

const UFC_SIBLINGS: SgRow[] = [
  {
    id: "sg-ufc-tot-1p5",
    name: "Total rounds",
    metadata: { fixture_id: "sg-ufc", market_type: "total", line: 1.5, family: "main" },
  },
  {
    id: "sg-ufc-tot-2p5",
    name: "Total rounds",
    metadata: { fixture_id: "sg-ufc", market_type: "total", line: 2.5, family: "main" },
  },
  {
    id: "sg-ufc-tot-3p5",
    name: "Total rounds",
    metadata: { fixture_id: "sg-ufc", market_type: "total", line: 3.5, family: "main" },
  },
  {
    id: "sg-ufc-method-ko",
    name: "Won by KO/TKO",
    metadata: { fixture_id: "sg-ufc", market_type: "method", family: "main" },
  },
  {
    id: "sg-ufc-method-sub",
    name: "Won by submission",
    metadata: { fixture_id: "sg-ufc", market_type: "method", family: "main" },
  },
  {
    id: "sg-ufc-dist",
    name: "Goes the distance",
    metadata: { fixture_id: "sg-ufc", market_type: "distance", family: "main" },
  },
];

const METHOD_REFUND_LINE =
  "A draw or No Contest voids the Method markets — those stakes are refunded in full.";

/** Shared renderer for both segmented frames. */
const SegmentedFrame = ({
  fixture,
  siblings,
  ruleLine,
}: {
  fixture: SgRow;
  siblings: SgRow[];
  ruleLine?: string;
}) => {
  const isMobile = useIsMobile();
  const [lines, setLines] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const pick = (id: string, s: "yes" | "no") => {
    setSel(id);
    setSide(s);
  };

  const model = buildModel(
    {
      ...fixture,
      start_date: SG_START,
      end_date: SG_END,
      is_resolved: false,
    } as unknown as MatchboardEvent,
    SG_NOW,
  );
  const groups = groupSegmentedMarkets(fixture, siblings, model.idx ?? null);
  const homeAbbr =
    (fixture.metadata.home_abbr as string) || (fixture.metadata.home as string) || "Home";

  const row = (r: SgRow, label: string): BoardOption => ({
    id: r.id,
    label,
    yesPrice: SG_PRICE[r.id] ?? 0.5,
  });

  const pickLine = (key: string, list: SgRow[]): SgRow | null => {
    if (list.length === 0) return null;
    const v = lines[key];
    return (
      (v != null ? list.find((e) => (e.metadata.line as number) === v) : null) ||
      list[Math.floor(list.length / 2)] ||
      null
    );
  };

  const board = (o: BoardOption | null, footer?: () => React.ReactNode) =>
    o ? (
      <LiteMarketBoard
        options={[o]}
        volumeText={VOL}
        selectedId={sel === o.id ? o.id : null}
        selectedSide={side}
        onSelect={pick}
        onDeselect={() => setSel(null)}
        compact={!!isMobile}
        hideHeader
        renderFooter={footer}
      />
    ) : null;

  return (
    <div className="space-y-2 bg-[#0A0B0D] p-4">
      <style>{`@keyframes gh-bl{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
      {groups.map((g) => {
        const series = g.key === "grp-series";
        const h = pickLine(`${g.key}:h`, g.handicap);
        const t = pickLine(`${g.key}:t`, g.total);
        return (
          <div key={g.key} className="space-y-2">
            <LiteBoardGroupHeader
              title={g.title}
              anchorId={g.key}
              annotation={boardGroupAnnotation(model, g.key, g.segmentIndex)}
            />
            {g.winner &&
              board(
                row(
                  g.winner,
                  (fixture.metadata.sport as string) === "mma" ? "Fight winner" : "Match winner",
                ),
              )}
            {g.mapwin && board(row(g.mapwin, `Map ${model.idx} winner`))}
            {g.distance && board(row(g.distance, g.distance.name))}
            {g.method.map((m) => (
              <div key={m.id}>{board(row(m, m.name))}</div>
            ))}
            {h &&
              board(
                row(
                  h,
                  `${series ? "Map" : "Rounds"} handicap · ${homeAbbr} ${formatSignedLine(
                    h.metadata.line as number,
                  )}`,
                ),
                () => (
                  <LiteLineScrubber
                    values={g.handicap.map((e) => e.metadata.line as number)}
                    value={h.metadata.line as number}
                    onChange={(v) => setLines((m) => ({ ...m, [`${g.key}:h`]: v }))}
                    compact={!!isMobile}
                  />
                ),
              )}
            {t &&
              board(
                row(
                  t,
                  `${series ? "Total maps" : "Total rounds"} · over ${t.metadata.line as number}`,
                ),
                () => (
                  <LiteLineScrubber
                    values={g.total.map((e) => e.metadata.line as number)}
                    value={t.metadata.line as number}
                    onChange={(v) => setLines((m) => ({ ...m, [`${g.key}:t`]: v }))}
                    format={(n) => String(n)}
                    compact={!!isMobile}
                  />
                ),
              )}
          </div>
        );
      })}
      {ruleLine ? <LiteTradeRuleCardLine text={ruleLine} /> : null}
    </div>
  );
};

/** The production rule card, carrying only the Method refund clause. */
const LiteTradeRuleCardLine = ({ text }: { text: string }) => (
  <TradeRuleCard body={text} />
);

export const SportsSegmentedCs2Preview = () => (
  <SegmentedFrame fixture={CS2_FIXTURE} siblings={CS2_SIBLINGS} />
);

export const SportsSegmentedMmaPreview = () => (
  <SegmentedFrame
    fixture={UFC_FIXTURE}
    siblings={UFC_SIBLINGS}
    ruleLine={METHOD_REFUND_LINE}
  />
);
