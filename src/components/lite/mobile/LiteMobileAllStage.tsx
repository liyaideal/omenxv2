// ============================================================
// LITE MOBILE ALL STAGE (390) — Intraday · Sports · Editor's picks,
// stacked in a single column with 22px module gaps.
// Contract: docs/design-contracts/list-final-touches-11.html (11B / 11C).
// The catalogue ("Will it happen?") stays owned by LiteEventsPage.
// ============================================================
import { MobileIntradayModule } from "./MobileIntradayModule";
import { MobileSportsModule } from "./MobileSportsModule";
import { EditorPicksModule } from "@/components/lite/picks/EditorPicksModule";
import { useEditorPicks } from "@/components/lite/picks/editorialPicks";
import type {
  QuickEvent,
  StockEventRow,
  Timeframe,
} from "@/components/lite/intraday/intradayData";
import type { SportsMatch } from "@/components/lite/sports/sportsData";

export const LiteMobileAllStage = ({
  currentFor,
  historyFor,
  stockRows,
  matches,
  tf,
  onSelectTf,
  tickSeconds,
  onOpenIntraday,
  onOpenSports,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  matches: SportsMatch[];
  tf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  tickSeconds: number;
  onOpenIntraday: () => void;
  onOpenSports: () => void;
}) => {
  const { picks, updatedAt } = useEditorPicks();
  return (
  <div className="flex flex-col" style={{ gap: 22, marginTop: 18 }}>
    <MobileIntradayModule
      currentFor={currentFor}
      historyFor={historyFor}
      stockRows={stockRows}
      tf={tf}
      onSelectTf={onSelectTf}
      tickSeconds={tickSeconds}
      onOpenIntraday={onOpenIntraday}
    />
    <MobileSportsModule matches={matches} onOpenAll={onOpenSports} />
    {picks.length > 0 && updatedAt && (
      <EditorPicksModule picks={picks} updatedAt={updatedAt} isMobile />
    )}
  </div>
  );
};

export default LiteMobileAllStage;