// ============================================================
// SPOT · SESSION BANNER (ST-1 / SG-HP)
// Pure move-out of the inline banner that used to live in
// LiteSpotTrade. Zero visual change: markup, classes and copy are
// byte-identical to the inline version, only the values arrive as
// props so the style-guide can mount the two states directly.
// ============================================================
import {
  formatLocalTime,
  formatMarketPrice,
  formatMinuteCountdown,
  type StockMarket,
  type StockSessionState,
} from "@/lib/usStockSessions";

export const SpotSessionBanner = ({
  session,
  market,
  closePrice,
  pctToday,
  nowOverride,
}: {
  session: StockSessionState;
  market: StockMarket;
  /** Close of the session that just ended (settling frame only). */
  closePrice: number | null;
  pctToday: number;
  /** Style-guide fixture only. Absent → live clock (production behaviour). */
  nowOverride?: Date;
}) => {
  if (session.phase === "settling") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">
          Closed {pctToday >= 0 ? "↑" : "↓"}
        </span>
        {closePrice != null && (
          <span className="font-mono text-sm text-foreground">
            {formatMarketPrice(closePrice, market)}
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          Next session in{" "}
          {session.settlingEndsAt
            ? formatMinuteCountdown(session.settlingEndsAt, nowOverride)
            : "00:00"}
        </span>
      </div>
    );
  }
  if (session.phase === "preSession") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">
          Next session
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          Opens {formatLocalTime(session.nextOpenAt)}
        </span>
        <span className="w-full text-[11px] text-muted-foreground">
          Chart shows the last session for reference.
        </span>
      </div>
    );
  }
  return null;
};

export default SpotSessionBanner;
