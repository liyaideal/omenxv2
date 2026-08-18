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
import { formatSignedLine } from "@/components/lite/sports/sportsData";

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
      {handicapHeld && (
        // 1× carries no Boost suffix — the title is the side label alone.
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
      )}
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
