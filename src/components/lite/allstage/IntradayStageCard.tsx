// ============================================================
// INTRADAY STAGE CARD — left column of the "All stage" (desktop).
// State A: one module-level dial + compact coin tiles + stock rows.
// State B: coin-major — three large cards, each with its own dial.
// Pixel contract: docs/design-contracts/all-stage-6A/6B.html
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import { formatMarketPrice, formatMarketTime, resolveStockMarket } from "@/lib/usStockSessions";
import { groupStockRows } from "@/components/lite/categoryviews/verticalBlocks";
import {
  COINS,
  COIN_META,
  Coin,
  QuickEvent,
  StockEventRow,
  TIMEFRAMES,
  Timeframe,
  derivedPrice,
  downOptionOf,
  formatCountdown,
  seedFromId,
  upOptionOf,
} from "@/components/lite/intraday/intradayData";

const ORANGE = "#FF8A3D";

const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

const SideButton = ({
  label,
  price,
  tone,
  padding,
  onClick,
}: {
  label: string;
  price: number;
  tone: "up" | "down";
  padding: string;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`chip-t1 ${tone === "up" ? "chip-t1-up" : "chip-t1-down"} flex items-center justify-between`}
    style={{ padding }}
  >
    <span style={{ fontSize: 11 }}>{label}</span>
    <span
      className="font-display"
      style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

const HistoryStrip = ({ history, dot = 9 }: { history: ("up" | "down")[]; dot?: number }) => {
  const last8 = history.slice(-8);
  return (
    <div className="flex items-center gap-[8px]">
      <span style={MICRO}>Last 8</span>
      <span className="flex gap-[3px]">
        {Array.from({ length: 8 }).map((_, i) => {
          const v = last8[i - (8 - last8.length)];
          return (
            <span
              key={i}
              style={{
                width: dot,
                height: dot,
                borderRadius: 2,
                background:
                  v === "up" ? "#33D6FF" : v === "down" ? "#CFFF4A" : "#1D2026",
              }}
            />
          );
        })}
      </span>
    </div>
  );
};

export const Dial = ({
  value,
  onChange,
  size,
}: {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
  size: "module" | "card";
}) =>
  size === "module" ? (
    <div
      className="inline-flex w-fit self-start gap-[2px]"
      style={{
        background: "#0A0B0D",
        border: "1px solid #1D2026",
        borderRadius: 12,
        padding: 4,
      }}
    >
      {TIMEFRAMES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              background: active ? ORANGE : "transparent",
              color: active ? "#0A0B0D" : "#9AA1AC",
              borderRadius: 9,
              padding: "8px 13px",
              fontSize: 12,
              fontWeight: active ? 700 : 600,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  ) : (
    <div
      className="grid gap-[3px]"
      style={{
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        background: "#0A0B0D",
        border: "1px solid #1D2026",
        borderRadius: 10,
        padding: 3,
      }}
    >
      {TIMEFRAMES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              background: active ? ORANGE : "transparent",
              color: active ? "#0A0B0D" : "#9AA1AC",
              borderRadius: 7,
              padding: "6px 0",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

const fmtUsd = (v: number) =>
  `$${v.toLocaleString(undefined, {
    minimumFractionDigits: v < 1000 ? 2 : 0,
    maximumFractionDigits: v < 1000 ? 2 : 0,
  })}`;

interface CoinCell {
  coin: Coin;
  event: QuickEvent | null;
  history: ("up" | "down")[];
}

const useCoinNumbers = (event: QuickEvent | null, tickSeconds: number) => {
  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const seed = event ? seedFromId(event.id) : 0;
  const base = event?.base_price ?? null;
  const upOdds = up ? up.price : 0.5;
  const price = derivedPrice(base, upOdds, seed, tickSeconds);
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const endMs = event?.end_date ? new Date(event.end_date).getTime() : null;
  return { up, down, base, upOdds, price, pct, endMs };
};

/** State A tile — compact, bound to the module dial. */
const CompactCoinTile = ({
  cell,
  tickSeconds,
}: {
  cell: CoinCell;
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const meta = COIN_META[cell.coin];
  const { up, down, base, upOdds, price, pct, endMs } = useCoinNumbers(
    cell.event,
    tickSeconds,
  );
  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cell.event) return;
    navigate(
      `/spot?event=${encodeURIComponent(cell.event.id)}${side ? `&side=${side}` : ""}`,
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go()}
      onKeyDown={(e) => {
        if (e.key === "Enter" && cell.event)
          navigate(`/spot?event=${encodeURIComponent(cell.event.id)}`);
      }}
      className="flex cursor-pointer flex-col gap-[10px]"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: 13,
      }}
    >
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-[9px]">
          <AssetAvatar symbol={meta.ticker} kind="crypto" size={34} />
          <span className="flex flex-col gap-[1px]">
            <span
              style={{
                fontSize: 11,
                color: "#9AA1AC",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {meta.ticker}
            </span>
            <span
              className="font-display"
              style={{
                fontSize: 16,
                color: "#fff",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {price != null ? fmtUsd(price) : "—"}
            </span>
          </span>
        </span>
        <span className="flex flex-col items-end gap-[1px]">
          <span style={MICRO}>Closes</span>
          <span
            className="font-display"
            style={{
              fontSize: 15,
              color: ORANGE,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {endMs != null ? formatCountdown(endMs - Date.now()) : "--:--"}
          </span>
        </span>
      </div>

      {base != null && price != null && cell.event ? (
        <RoundPlot
          eventId={cell.event.id}
          basePrice={base}
          currentPrice={price}
          upOdds={upOdds}
          height={52}
        />
      ) : (
        <div style={{ height: 52, background: "#0C1013" }} />
      )}

      <HistoryStrip history={cell.history} />

      <div className="grid grid-cols-2 gap-[7px]">
        <SideButton
          label="Up"
          price={up?.price ?? 0.5}
          tone="up"
          padding="10px"
          onClick={go("up")}
        />
        <SideButton
          label="Down"
          price={down?.price ?? 0.5}
          tone="down"
          padding="10px"
          onClick={go("down")}
        />
      </div>
      <span className="sr-only">{pct.toFixed(2)}%</span>
    </div>
  );
};

/** State B card — coin-major, own dial above its own chart. */
const MajorCoinCard = ({
  coin,
  currentFor,
  historyFor,
  tickSeconds,
}: {
  coin: Coin;
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const [tf, setTf] = useState<Timeframe>("5m");
  const meta = COIN_META[coin];
  const event = currentFor.get(`${coin}-${tf}`) ?? null;
  const history = historyFor.get(`${coin}-${tf}`) ?? [];
  const { up, down, base, upOdds, price, pct, endMs } = useCoinNumbers(
    event,
    tickSeconds,
  );

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(
      `/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`,
    );
  };

  return (
    <div
      className="flex flex-col gap-[11px]"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div className="flex items-center gap-[9px]">
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={32} />
        <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
          <span
            style={{
              fontSize: 10,
              color: "#9AA1AC",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            {meta.ticker}
          </span>
          <span
            className="font-display"
            style={{
              fontSize: 17,
              color: "#fff",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {price != null ? fmtUsd(price) : "—"}
          </span>
        </span>
        <span className="flex flex-col items-end gap-[1px]">
          <span style={{ ...MICRO, letterSpacing: "0.12em" }}>Closes</span>
          <span
            className="font-display"
            style={{
              fontSize: 15,
              color: ORANGE,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {endMs != null ? formatCountdown(endMs - Date.now()) : "--:--"}
          </span>
        </span>
      </div>

      <Dial value={tf} onChange={setTf} size="card" />

      <div className="flex flex-col gap-[7px]">
        {base != null && price != null && event ? (
          <RoundPlot
            eventId={event.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={150}
          />
        ) : (
          <div style={{ height: 150, background: "#0C1013" }} />
        )}
        <div className="flex items-center justify-between">
          <span
            style={{ fontSize: 10, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}
          >
            Round open {base != null ? fmtUsd(base) : "—"}
          </span>
          <span
            style={{
              fontSize: 10,
              color: pct >= 0 ? "hsl(74 100% 65%)" : "hsl(0 100% 68%)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct >= 0 ? "+" : "−"}
            {Math.abs(pct).toFixed(2)}%
          </span>
        </div>
      </div>

      <HistoryStrip history={history} dot={8} />

      <div className="grid grid-cols-2 gap-[6px]">
        <SideButton
          label="Up"
          price={up?.price ?? 0.5}
          tone="up"
          padding="12px 10px"
          onClick={go("up")}
        />
        <SideButton
          label="Down"
          price={down?.price ?? 0.5}
          tone="down"
          padding="12px 10px"
          onClick={go("down")}
        />
      </div>
    </div>
  );
};

const StockStageRow = ({
  row,
  tickSeconds,
}: {
  row: StockEventRow;
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket(row);
  const seed = seedFromId(row.id);
  const base = row.base_price;
  const price =
    base != null ? base * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009) : null;
  const pct = base && price ? ((price - base) / base) * 100 : 0;

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/spot?event=${encodeURIComponent(row.id)}${side ? `&side=${side}` : ""}`,
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go()}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
      }}
      className="box-border flex cursor-pointer items-center gap-[13px]"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "11px 14px",
      }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-[12px]">
        <AssetAvatar symbol={ticker} kind="equity" size={44} />
        <span className="flex min-w-0 flex-col gap-[1px]">
          <span
            style={{
              fontSize: 15,
              color: "#fff",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            {ticker}
          </span>
          <span className="truncate" style={{ fontSize: 12, color: "#6B7280" }}>
            {company}
          </span>
        </span>
      </span>
      <span
        className="flex flex-none flex-col items-end gap-[1px]"
        style={{ marginRight: 6 }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 16,
            color: "#fff",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {price != null ? formatMarketPrice(price, market) : "—"}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: pct >= 0 ? "hsl(74 100% 65%)" : "hsl(0 100% 68%)",
          }}
        >
          {pct >= 0 ? "+" : "−"}
          {Math.abs(pct).toFixed(2)}%
        </span>
      </span>
      {(["up", "down"] as const).map((tone) => (
        <button
          key={tone}
          type="button"
          onClick={go(tone)}
          className={`chip-t1 ${tone === "up" ? "chip-t1-up" : "chip-t1-down"} box-border flex flex-none items-center justify-center gap-[5px] whitespace-nowrap`}
          style={{ borderRadius: 12, minHeight: 44, padding: "0 15px" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {tone === "up" ? "Up" : "Not up"}
          </span>
          <span
            className="font-display"
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round((tone === "up" ? row.upPrice : row.downPrice) * 100)}¢
          </span>
        </button>
      ))}
    </div>
  );
};

export const IntradayStageCard = ({
  currentFor,
  historyFor,
  stockRows,
  tickSeconds,
  onOpenIntraday,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  tickSeconds: number;
  onOpenIntraday: () => void;
}) => {
  const [tf, setTf] = useState<Timeframe>("5m");

  // ONE shared selector for every surface — the All stage, the Intraday view
  // and the Finance view group the same feed with the same session rules.
  const groups = useMemo(
    () => groupStockRows(stockRows),
    [stockRows, tickSeconds],
  );
  const openStocks = groups.trading;
  const sessionOpen = groups.sessionMarket != null && groups.sessionEnd != null;
  const nextOpen = groups.wakeLabel;

  const closeLabel = useMemo(() => {
    const market = groups.sessionMarket;
    if (!market || groups.sessionEnd == null) return "";
    const where = market.key === "hk" ? "HK" : "US";
    return `${where} closes ${formatMarketTime(new Date(groups.sessionEnd), market)} ${market.label}`;
  }, [groups.sessionMarket, groups.sessionEnd]);

  const cells: CoinCell[] = COINS.map((coin) => ({
    coin,
    event: currentFor.get(`${coin}-${tf}`) ?? null,
    history: historyFor.get(`${coin}-${tf}`) ?? [],
  }));

  return (
    <div
      className="flex flex-col justify-between"
      style={{
        background: "#111318",
        border: "1px solid #1D2026",
        borderRadius: 18,
        padding: 20,
        gap: sessionOpen ? 16 : 14,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-[20px]">
        <div className="flex flex-col gap-[6px]">
          <span
            className="flex items-center gap-[8px]"
            style={{
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
              fontSize: 26,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Will the price go up?
          </span>
          <span style={{ fontSize: 12, color: "#9AA1AC" }}>
            {sessionOpen ? (
              <>
                Pick Up or Down before the clock hits zero. Winning shares pay{" "}
                <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>, losing
                shares pay $0.
              </>
            ) : (
              "One card per coin. Pick how long the round lasts above the chart — it sets that coin's clock and prices."
            )}
          </span>
          {sessionOpen && (
            <div style={{ paddingTop: 6 }}>
              <Dial value={tf} onChange={setTf} size="module" />
            </div>
          )}
        </div>
        {sessionOpen ? (
          <span className="flex flex-col items-end gap-[5px]">
            <span
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                border: "1px dashed #2B3038",
                background:
                  "repeating-linear-gradient(135deg,#15181D 0 10px,#111418 10px 20px)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#4B5563",
                  fontWeight: 700,
                }}
              >
                art
              </span>
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#4B5563",
                maxWidth: 150,
                textAlign: "right",
              }}
            >
              Art slot 1 · Bonix bust, header corner only
            </span>
          </span>
        ) : (
          <span className="flex flex-col items-end gap-[3px]">
            <span style={{ fontSize: 13, color: "#E6E9EE", fontWeight: 600 }}>
              No stock session today
            </span>
            {nextOpen && (
              <span style={{ fontSize: 11, color: "#6B7280" }}>{nextOpen}</span>
            )}
          </span>
        )}
      </div>

      {/* Coins */}
      {sessionOpen ? (
        <div className="grid grid-cols-3 gap-[12px]">
          {cells.map((c) => (
            <CompactCoinTile key={c.coin} cell={c} tickSeconds={tickSeconds} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 items-start gap-[12px]">
          {COINS.map((coin) => (
            <MajorCoinCard
              key={coin}
              coin={coin}
              currentFor={currentFor}
              historyFor={historyFor}
              tickSeconds={tickSeconds}
            />
          ))}
        </div>
      )}

      {/* Stocks closing today */}
      {sessionOpen && (
        <div className="flex flex-col gap-[9px]">
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#9AA1AC",
                fontWeight: 700,
              }}
            >
              Stocks closing today
            </span>
            <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
              Will it finish higher than it opened? · {closeLabel}
            </span>
          </div>
          {openStocks.slice(0, 3).map((r) => (
            <StockStageRow key={r.id} row={r} tickSeconds={tickSeconds} />
          ))}
        </div>
      )}

      {/* Footer */}
      <button
        type="button"
        onClick={onOpenIntraday}
        className="flex items-center justify-between"
        style={{ borderTop: "1px solid #1D2026", paddingTop: 13 }}
      >
        <span style={{ fontSize: 12, color: "#9AA1AC" }}>
          {sessionOpen
            ? "All windows and the full session list inside"
            : "Stocks return when the next session opens"}
        </span>
        <span style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}>
          Open Intraday →
        </span>
      </button>
    </div>
  );
};

export default IntradayStageCard;