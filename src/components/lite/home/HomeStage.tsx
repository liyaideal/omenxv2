// ============================================================
// HOME STAGE — the "All" view body (首页 All 改版 · D2-S3 定稿, 2026-11-09).
// Five bare sections in reading order, hairlines between them (G1):
//   §1 Sports · §2 Crypto · §3 Stocks · §3b Editor's Desk · §4 More markets
// Desktop = the 1440 canvas (D2-S3); mobile = the 390 boards (M-*), one
// column, redone for the phone rather than squeezed (G4). Each section
// owns its states; the stage only orders them.
// ============================================================
import type { QuickEvent, StockEventRow, Timeframe } from "@/components/lite/intraday/intradayData";
import type { SportsMatch } from "@/components/lite/sports/sportsData";
import type { EditorPick } from "@/components/lite/picks/editorialPicks";
import type { EventRow } from "@/hooks/useMarketListData";
import { HomeSportsSection } from "./HomeSportsSection";
import { HomeCryptoSection } from "./HomeCryptoSection";
import { HomeStocksSection } from "./HomeStocksSection";
import { HomeDeskSection } from "./HomeDeskSection";
import { HomeMoreSection } from "./HomeMoreSection";
import "./home-all.css";

export interface HomeStageProps {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  btcTodayVolume?: number;
  stockRows: StockEventRow[];
  matches: SportsMatch[];
  picks: EditorPick[];
  /** Long-dated events (everything that is not a round or a fixture). */
  events: EventRow[];
  getBoostMax: (category: string) => number | null;
  tf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  livePrices?: Record<string, number | undefined>;
  isMobile: boolean;
  onOpenSports: () => void;
  onOpenFinance: (market?: "us" | "hk" | "kr") => void;
  /** Frozen clock for style-guide fixtures (ms); production leaves it unset. */
  nowOverride?: number;
}

const Rule = () => <div className="secrule" />;

export const HomeStage = ({
  currentFor,
  historyFor,
  btcTodayVolume,
  stockRows,
  matches,
  picks,
  events,
  getBoostMax,
  tf,
  onSelectTf,
  livePrices,
  isMobile,
  onOpenSports,
  onOpenFinance,
  nowOverride,
}: HomeStageProps) => {
  const blocks = [
    matches.length > 0 ? <HomeSportsSection key="sports" matches={matches} isMobile={isMobile} onOpenAll={onOpenSports} nowOverride={nowOverride} /> : null,
    currentFor.size > 0 ? (
      <HomeCryptoSection key="crypto" currentFor={currentFor} historyFor={historyFor} btcTodayVolume={btcTodayVolume} tf={tf} onSelectTf={onSelectTf} livePrices={livePrices} isMobile={isMobile} nowOverride={nowOverride} />
    ) : null,
    stockRows.length > 0 ? <HomeStocksSection key="stocks" stockRows={stockRows} isMobile={isMobile} onOpenAll={onOpenFinance} nowOverride={nowOverride != null ? new Date(nowOverride) : undefined} /> : null,
    picks.length > 0 ? <HomeDeskSection key="desk" picks={picks} isMobile={isMobile} nowOverride={nowOverride} /> : null,
    events.length > 0 ? <HomeMoreSection key="more" events={events} getBoostMax={getBoostMax} isMobile={isMobile} nowOverride={nowOverride} /> : null,
  ].filter(Boolean);

  return (
    <div className={isMobile ? "hall hall-m" : "hall"}>
      {blocks.map((b, i) => (
        <div key={i}>
          {i > 0 && <Rule />}
          {b}
        </div>
      ))}
    </div>
  );
};

export default HomeStage;
