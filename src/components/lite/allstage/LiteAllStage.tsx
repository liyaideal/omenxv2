// ============================================================
// LITE ALL STAGE — desktop-only "All" view stage.
// 62% Intraday card / 1fr Sports card. Mobile is unaffected.
// Pixel contract: docs/design-contracts/all-stage-6A/6B.html
// ============================================================
import { SportsStageCard } from "@/components/lite/sports/SportsStageCard";
import { SportsMatch } from "@/components/lite/sports/sportsData";
import {
  QuickEvent,
  StockEventRow,
} from "@/components/lite/intraday/intradayData";
import { IntradayStageCard } from "./IntradayStageCard";

export const LiteAllStage = ({
  currentFor,
  historyFor,
  stockRows,
  matches,
  tickSeconds,
  onOpenIntraday,
  onOpenSports,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  matches: SportsMatch[];
  tickSeconds: number;
  onOpenIntraday: () => void;
  onOpenSports: () => void;
}) => (
  <div
    className="grid items-stretch gap-[16px]"
    style={{ gridTemplateColumns: "62% 1fr", marginTop: 20 }}
  >
    <IntradayStageCard
      currentFor={currentFor}
      historyFor={historyFor}
      stockRows={stockRows}
      tickSeconds={tickSeconds}
      onOpenIntraday={onOpenIntraday}
    />
    {matches.length > 0 && (
      <SportsStageCard matches={matches} onOpenAll={onOpenSports} />
    )}
  </div>
);

export default LiteAllStage;