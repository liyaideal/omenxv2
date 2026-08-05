// ============================================================
// INTRADAY CATEGORY VIEW (7A) — desktop, category chip "Intraday".
// Pixel contract: docs/design-contracts/category-views-7.html #7a
// Plain cards (no orange rail), module-level round-length dial,
// three coin tiles, then the full stock session list incl. asleep.
// Every tile/row routes into the existing /spot trade page.
//
// The shared primitives (coin tile, stock rows, dial, grouping) now live
// in ./verticalBlocks so the Crypto and Finance verticals reuse the very
// same rendered pixels.
// ============================================================
import { useMemo, useState } from "react";
import { COINS, QuickEvent, StockEventRow, Timeframe } from "@/components/lite/intraday/intradayData";
import { formatMarketTime } from "@/lib/usStockSessions";
import {
  AsleepStockRow,
  CoinTile,
  ORANGE,
  fmtLeft,
  RoundLengthDial,
  StockGroups,
  TradingStockRow,
  groupStockRows,
} from "./verticalBlocks";

export const LiteIntradayView = ({
  currentFor,
  historyFor,
  stockRows,
  tickSeconds,
  sessionNow,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  tickSeconds: number;
  /** Style-guide only — freeze the market calendar clock. */
  sessionNow?: Date;
}) => {
  const [tf, setTf] = useState<Timeframe>("5m");

  const groups: StockGroups = useMemo(
    () => groupStockRows(stockRows, sessionNow),
    [stockRows, tickSeconds, sessionNow],
  );

  const total = groups.trading.length + groups.asleep.length;

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
            <span
              className="animate-pulse"
              style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE }}
            />
            Intraday · rolling rounds
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
            Will the price go up?
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
            Round length
          </span>
          <RoundLengthDial value={tf} onSelect={setTf} />
        </div>
      </div>

      {/* Coin tiles */}
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

      {/* Stocks */}
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
              Will the stock finish higher than it opened?
            </span>
            <span style={{ fontSize: 12, color: "#9AA1AC" }}>
              One round per trading day. It settles at the closing bell — winning
              shares pay <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>,
              losing shares pay $0.
            </span>
          </div>
          {groups.sessionMarket && groups.sessionEnd != null && (
            <span
              className="flex flex-none items-center"
              style={{
                gap: 8,
                background: "#131519",
                border: "1px solid #23262D",
                borderRadius: 999,
                padding: "8px 14px",
              }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE }}
              />
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>
                {groups.sessionMarket.key === "hk" ? "HK" : "US"} session open
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#9AA1AC",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                closes{" "}
                {formatMarketTime(new Date(groups.sessionEnd), groups.sessionMarket)}{" "}
                {groups.sessionMarket.label} ·{" "}
                {fmtLeft(groups.sessionEnd - (sessionNow?.getTime() ?? Date.now()))}
              </span>
            </span>
          )}
        </div>

        {groups.trading.length > 0 && (
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            {groups.trading.map((r) => (
              <TradingStockRow key={r.id} row={r} tickSeconds={tickSeconds} />
            ))}
          </div>
        )}

        {groups.asleep.length > 0 && (
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
                Asleep until their market opens
              </span>
              <span style={{ height: 1, background: "#1D2026", flex: 1 }} />
              {groups.wakeLabel && (
                <span
                  className="whitespace-nowrap"
                  style={{ fontSize: 12, color: "#9AA1AC" }}
                >
                  {groups.wakeLabel}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              {groups.asleep.map((a) => (
                <AsleepStockRow key={a.row.id} row={a.row} nextOpen={a.nextOpen} />
              ))}
            </div>
          </>
        )}

        <div
          className="flex items-center justify-between"
          style={{ borderTop: "1px solid #1D2026", paddingTop: 14 }}
        >
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {total} names · {groups.trading.length} trading now, {groups.asleep.length}{" "}
            asleep. Crypto rounds never stop.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiteIntradayView;
