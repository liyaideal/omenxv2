// ============================================================
// Daily-stock SERIES card + day row for the Lite settled list.
// One card per ticker collapses every settled daily up/down day of
// that stock. Consumer wording only; MARKET axis for side identity,
// MONEY axis for the viewer's own result.
// ============================================================
import { ChevronRight, Check } from "lucide-react";
import type { ResolvedEvent } from "@/hooks/useResolvedEvents";
import { deriveTickerFromEvent } from "@/components/SpotStatsHeader";
import { resolveWinner } from "@/components/lite/LiteSettledCard";

export const STOCK_COMPANY: Record<string, string> = {
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  META: "Meta Platforms",
  AMZN: "Amazon",
};

/** Daily up/down stock event? Same ticker derivation the Lite spot page uses. */
export const isDailyStockEvent = (e: {
  id: string;
  name: string;
  category: string;
}): boolean => {
  if ((e.category || "").toLowerCase() !== "stocks") return false;
  return deriveTickerFromEvent(e.id, e.name) !== "STOCK";
};

export const tickerOf = (e: { id: string; name: string }) =>
  deriveTickerFromEvent(e.id, e.name);

export interface SettledSeries {
  ticker: string;
  company: string;
  days: ResolvedEvent[]; // newest first
  userResult: number | null; // most recent participated day's result
}

/** "Yesterday" / "Jul 28" day label for a settled day. */
export const dayLabel = (settledAt: string | null): string => {
  if (!settledAt) return "—";
  const d = new Date(settledAt);
  if (isNaN(d.getTime())) return "—";
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const money = (n: number) => `$${Math.abs(n).toFixed(2)}`;

const ResultChip = ({ value }: { value: number }) =>
  value >= 0 ? (
    <span className="rounded-full bg-trading-green px-2.5 py-[3px] font-mono text-[11px] font-semibold text-[#0A0B0D]">
      Won +{money(value)}
    </span>
  ) : (
    <span className="rounded-full bg-trading-red/85 px-2.5 py-[3px] font-mono text-[11px] font-semibold text-[#0A0B0D]">
      Lost −{money(value)}
    </span>
  );

interface CardProps {
  series: SettledSeries;
  onSelect: (ticker: string) => void;
}

export const LiteSettledSeriesCard = ({ series, onSelect }: CardProps) => {
  const latest = series.days[0];
  const winner = latest ? resolveWinner(latest) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(series.ticker)}
      className="mkt-card group flex w-full items-center gap-3 rounded-[16px] border border-[#1D2026] bg-[#131519] p-[18px] text-left"
    >
      <span className="shrink-0 rounded-lg bg-[#242830] px-2.5 py-1.5 font-mono text-[12px] font-semibold text-foreground">
        {series.ticker}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[15px] font-bold text-foreground">
          {series.company} ({series.ticker}) — daily close
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          {latest && winner && (
            <span className={winner.winnerIsYes ? "text-yes" : "text-no"}>
              {dayLabel(latest.settled_at)}: ✓ {winner.label} won
            </span>
          )}
          <span className="text-[#6B7280]">
            {series.days.length} settled day{series.days.length === 1 ? "" : "s"}
          </span>
          {series.userResult !== null && <ResultChip value={series.userResult} />}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />
    </button>
  );
};

interface DayRowProps {
  event: ResolvedEvent;
  onSelect: (eventId: string) => void;
}

/** Ledger-style day row used in the series view. */
export const LiteSettledSeriesDayRow = ({ event, onSelect }: DayRowProps) => {
  const winner = resolveWinner(event);
  const result = event.userParticipated ? event.userPnl ?? 0 : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className="grid w-full grid-cols-[72px_1fr_auto_16px] items-center gap-x-3 rounded-lg px-2 py-2.5 text-left hover:bg-muted/20"
    >
      <span className="font-mono text-xs text-muted-foreground">
        {dayLabel(event.settled_at)}
      </span>
      {winner ? (
        <span
          className={
            winner.winnerIsYes
              ? "flex items-center gap-1 text-xs font-semibold text-yes"
              : "flex items-center gap-1 text-xs font-semibold text-no"
          }
        >
          <Check className="h-3.5 w-3.5" />
          {winner.label} won
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Settled</span>
      )}
      <span>{result !== null && <ResultChip value={result} />}</span>
      <ChevronRight className="h-4 w-4 text-[#6B7280]" />
    </button>
  );
};

export default LiteSettledSeriesCard;