// ============================================================
// HOME STAGE (HP-1) — the "All" view body.
// Desktop: 12-grid, span8 (crypto + stocks) | span4 (sports + desk),
// both columns flush top and bottom (stocks stretches).
// Mobile: single column — crypto → stocks → sports → desk.
// ============================================================
import type { QuickEvent, StockEventRow, Timeframe } from "@/components/lite/intraday/intradayData";
import type { SportsMatch } from "@/components/lite/sports/sportsData";
import type { EditorPick } from "@/components/lite/picks/editorialPicks";
import { HomeCryptoCard } from "./HomeCryptoCard";
import { HomeStocksCard } from "./HomeStocksCard";
import { HomeSportsCard } from "./HomeSportsCard";
import { HomeDeskCard } from "./HomeDeskCard";

export interface HomeStageProps {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  stocksLoading: boolean;
  matches: SportsMatch[];
  picks: EditorPick[];
  tf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  tickSeconds: number;
  isMobile: boolean;
  onOpenSports: () => void;
}

export const HomeStage = ({
  currentFor,
  historyFor,
  stockRows,
  stocksLoading,
  matches,
  picks,
  tf,
  onSelectTf,
  tickSeconds,
  isMobile,
  onOpenSports,
}: HomeStageProps) => {
  const crypto = (
    <HomeCryptoCard
      currentFor={currentFor}
      historyFor={historyFor}
      tf={tf}
      onSelectTf={onSelectTf}
      tickSeconds={tickSeconds}
      isMobile={isMobile}
    />
  );
  const stocks = (
    <HomeStocksCard
      stockRows={stockRows}
      tickSeconds={tickSeconds}
      isMobile={isMobile}
      loading={stocksLoading}
    />
  );
  const sports = (
    <HomeSportsCard
      matches={matches}
      isMobile={isMobile}
      extraRows={picks.length === 0 ? 2 : 0}
      onOpenAll={onOpenSports}
    />
  );
  const desk = <HomeDeskCard picks={picks} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <div className="flex flex-col" style={{ gap: 18, marginTop: 18 }}>
        {crypto}
        {stocks}
        {sports}
        {desk}
      </div>
    );
  }

  return (
    <div
      className="grid items-stretch"
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: 24,
        marginTop: 28,
      }}
    >
      <div className="flex flex-col" style={{ gridColumn: "span 8" }}>
        <div style={{ flex: "none" }}>{crypto}</div>
        <div style={{ marginTop: 24, flex: 1, minHeight: 0 }}>{stocks}</div>
      </div>
      <div className="flex flex-col" style={{ gridColumn: "span 4", gap: 24 }}>
        {sports}
        {desk}
      </div>
    </div>
  );
};

export default HomeStage;
