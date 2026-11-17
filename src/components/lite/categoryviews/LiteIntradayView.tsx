// ============================================================
// INTRADAY CATEGORY VIEW (7A) — desktop, category chip "Intraday".
// Pixel contract: docs/design-contracts/category-views-7.html #7a — superseded for the stock section's
// header and footer by DESIGN.md §Addendum 2026-11-17 (market tabs + status line; no session pill, no footer).
// Plain cards (no orange rail), module-level round-length dial,
// three coin tiles, then the full stock session list incl. asleep.
// Every tile/row routes into the existing /spot trade page.
//
// The shared primitives (coin tile, stock rows, dial, grouping) now live
// in ./verticalBlocks so the Crypto and Finance verticals reuse the very
// same rendered pixels.
// ============================================================
import { t, useT } from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { COINS, QuickEvent, StockEventRow, Timeframe } from "@/components/lite/intraday/intradayData";
import { resolveStockMarket } from "@/lib/usStockSessions";
import {
  AsleepStockRow,
  CoinTile,
  ORANGE,
  RoundDial,
  StockGroups,
  TradingStockRow,
  groupStockRows,
} from "./verticalBlocks";
import { MarketTabs, buildMarketHeader, marketLabel } from "./marketHeader";
import { EmptyState } from "@/components/states";
import { LivePulse } from "@/components/lite/shared/primitives";

export const LiteIntradayView = ({
  currentFor,
  historyFor,
  stockRows,
  tickSeconds,
  sessionNow,
  boostOnly,
  initialMarket = "all",
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  tickSeconds: number;
  /** Style-guide only — freeze the market calendar clock. */
  sessionNow?: Date;
  /** Boost composes in place — engine hides until boost rounds exist. */
  boostOnly?: boolean;
  /** Style-guide only — open the stock section on one market tab. */
  initialMarket?: string;
}) => {
  useT(); // re-render on language change / catalog arrival
  const [tf, setTf] = useState<Timeframe>("5m");
  /** Stock section market tab — "all" or a market key (CPO 2026-11-17, same header as the Finance list). */
  const [market, setMarket] = useState<string>(initialMarket);

  const groups: StockGroups = useMemo(
    () => groupStockRows(stockRows, sessionNow),
    [stockRows, tickSeconds, sessionNow],
  );

  const now = sessionNow ?? new Date();
  const { tabs, statusText, count } = buildMarketHeader({ groups, region: market, now });
  // Every stock round is gone (no tabs to pick from) while one market is selected → back to All.
  const stuck = market !== "all" && tabs.length === 0;
  useEffect(() => {
    if (stuck) setMarket("all");
  }, [stuck]);
  const inMarket = (r: StockEventRow) => market === "all" || resolveStockMarket(r).key === market;
  const trading = groups.trading.filter(inMarket);
  const asleep = groups.asleep.filter((a) => inMarket(a.row));
  // "… winning shares pay <payout>$1</payout>, losing shares pay $0." — the payout is the one white word.
  const explainerParts = t("events.screen.simple.intraday_view.intraday_vertical.stock_round_explainer").split(/<\/?payout>/);

  return (
    <div className="flex flex-col" style={{ marginTop: 20, gap: 22 }}>
      {/* Header */}
      <div className="flex items-end justify-between" style={{ gap: 24 }}>
        <div className="flex flex-col" style={{ gap: 7 }}>
          <span
            className="flex items-center"
            style={{
              gap: 8,
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: ORANGE,
              fontWeight: 700,
            }}
          >
            <LivePulse size={6} color={ORANGE} />
            {t("events.screen.simple.all_stage.intraday_stage_card.rolling_rounds")}
          </span>
          <span
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            {t("events.screen.simple.home.home_crypto_card.will_the_price_go_up")}
          </span>
          <span style={{ fontSize: 13, color: "#9AA1AC" }}>
            Pick Up or Down before the clock hits zero. Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>, losing
            shares pay $0.
          </span>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6B7280",
              fontWeight: 700,
            }}
          >
            {t("events.screen.lite.lite_round_navigation.round")}
          </span>
          <RoundDial value={tf} onSelect={setTf} />
        </div>
      </div>

      {boostOnly && (
        <EmptyState
          variant="page"
          title={t("events.screen.simple.crypto_view.crypto_vertical.nothing_boosted_here_yet")}
          illustrationSrc="/assets/desktop/empty-no-boost.png"
        />
      )}

      {/* Coin tiles */}
      {!boostOnly && (
      <div className="grid grid-cols-3" style={{ gap: 16 }}>
        {COINS.map((coin) => (
          <CoinTile
            key={coin}
            coin={coin}
            event={currentFor.get(`${coin}-${tf}`) ?? null}
            history={historyFor.get(`${coin}-${tf}`) ?? []}
            tickSeconds={tickSeconds}
          />
        ))}
      </div>
      )}

      {/* Stocks */}
      {!boostOnly && (
      <div
        className="flex flex-col"
        style={{ gap: 12, borderTop: "1px solid #1D2026", paddingTop: 22 }}
      >
        <div className="flex items-end justify-between" style={{ gap: 20 }}>
          <div className="flex flex-col" style={{ gap: 5 }}>
            <span
              className="font-display"
              style={{
                fontWeight: 700,
                fontSize: 20,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {t("events.screen.simple.intraday_view.intraday_vertical.will_the_stock_finish_higher_than_it_opened")}
            </span>
            <span style={{ fontSize: 12, color: "#9AA1AC" }}>
              {explainerParts.length === 3 ? (
                <>
                  {explainerParts[0]}
                  <strong style={{ color: "#fff", fontWeight: 600 }}>{explainerParts[1]}</strong>
                  {explainerParts[2]}
                </>
              ) : (
                explainerParts.join("")
              )}
            </span>
          </div>
          {tabs.length > 0 && (
            <div className="flex flex-none flex-col items-end" style={{ gap: 10 }}>
              <MarketTabs tabs={tabs} value={market} onChange={setMarket} />
              {/* the slot keeps its height when there is no status line, so the tabs don't jump */}
              <span className="flex items-center whitespace-nowrap" style={{ minHeight: 18, fontSize: 12.5, color: "#98A1AD" }}>
                {statusText ? <span data-finance-market-status>{statusText}</span> : null}
              </span>
            </div>
          )}
        </div>

        {trading.length > 0 && (
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            {trading.map((r) => (
              <TradingStockRow key={r.id} row={r} tickSeconds={tickSeconds} />
            ))}
          </div>
        )}

        {asleep.length > 0 && (
          <>
            <div className="flex items-center" style={{ gap: 12, paddingTop: 8 }}>
              <span
                className="whitespace-nowrap"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#6B7280",
                  fontWeight: 700,
                }}
              >
                {t("events.screen.simple.intraday_view.intraday_vertical.asleep_until_their_market_opens")}
              </span>
              <span style={{ height: 1, background: "#1D2026", flex: 1 }} />
              {/* no "New York opens Tue 22:30" stamp here any more — the status line says how long until the open */}
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              {asleep.map((a) => (
                <AsleepStockRow key={a.row.id} row={a.row} nextOpen={a.nextOpen} />
              ))}
            </div>
          </>
        )}

        {/* The selected market has no rounds today — lynx fallback instead of a blank section. */}
        {market !== "all" && count(market) === 0 && (
          <EmptyState
            variant="page"
            title={t("events.screen.simple.finance_view.finance_vertical.no_rounds_today", { market: marketLabel(market) })}
            description={t("events.screen.simple.finance_view.finance_vertical.no_rounds_today_hint")}
            illustrationSrc="/assets/desktop/empty-no-boost.png"
          />
        )}
        {/* The "69 names · 19 trading now, 50 asleep" footer went (2026-11-17): the tabs carry the counts. */}
      </div>
      )}
    </div>
  );
};

export default LiteIntradayView;
