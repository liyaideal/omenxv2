// ============================================================
// INTRADAY CATEGORY VIEW (7A) — desktop, category chip "Intraday".
// Pixel contract: docs/design-contracts/category-views-7.html #7a
// Plain cards (no orange rail), module-level round-length dial,
// three coin tiles, then the full stock session list incl. asleep.
// Every tile/row routes into the existing /spot trade page.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import {
  formatMarketPrice,
  formatMarketTime,
  formatSessionStamp,
  getMarketSession,
  marketCityName,
  resolveStockMarket,
  StockMarket,
} from "@/lib/usStockSessions";
import {
  COINS,
  COIN_META,
  Coin,
  QuickEvent,
  StockEventRow,
  TIMEFRAMES,
  Timeframe,
  compactUsd,
  derivedPrice,
  downOptionOf,
  formatCountdown,
  seedFromId,
  smoothWalk,
  upOptionOf,
} from "@/components/lite/intraday/intradayData";

const ORANGE = "#FF8A3D";
const UP = "#33D6FF";
const DOWN = "#CFFF4A";

const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

const fmtUsd = (v: number) =>
  `$${v.toLocaleString(undefined, {
    minimumFractionDigits: v < 1000 ? 2 : 0,
    maximumFractionDigits: v < 1000 ? 2 : 0,
  })}`;

const pctColor = (pct: number) =>
  pct >= 0 ? "hsl(74 100% 65%)" : "hsl(0 100% 68%)";

const fmtPct = (pct: number) =>
  `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(2)}%`;

/** "3h 12m left" / "48m left". */
const fmtLeft = (ms: number) => {
  const mins = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
};

/** "Tue 09:30 HKT" for a market-local instant. */
const openStamp = (d: Date, market: StockMarket) => formatSessionStamp(d, market);

// ------------------------------------------------------------------
// Coin sparkline — dashed open baseline, gradient underfill, end dot.
// ------------------------------------------------------------------
const SPARK_W = 372;
const SPARK_H = 86;
const SPARK_POINTS = 26;

const CoinSpark = ({
  seed,
  base,
  upOdds,
  above,
}: {
  seed: number;
  base: number;
  upOdds: number;
  above: boolean;
}) => {
  const gid = `spark-${seed}-${above ? "u" : "d"}`;
  const { line, area, baselineY, last } = useMemo(() => {
    const drift = (upOdds - 0.5) * 0.0007;
    const raw = smoothWalk(seed, base, SPARK_POINTS, 0.0006, drift);
    const shift = base - raw[0];
    const series = raw.map((v) => v + shift);
    const maxDev = Math.max(
      ...series.map((v) => Math.abs(v - base)),
      Math.abs(base) * 0.0009,
    );
    const half = (SPARK_H * 0.62) / 2;
    const mid = SPARK_H / 2;
    const y = (v: number) => mid - ((v - base) / maxDev) * half;
    const pts = series.map((v, i) => ({
      x: 2 + (i / (SPARK_POINTS - 1)) * (SPARK_W - 4),
      y: y(v),
    }));
    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    return {
      line: d,
      area: `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${SPARK_H} L ${pts[0].x.toFixed(1)} ${SPARK_H} Z`,
      baselineY: mid,
      last: pts[pts.length - 1],
    };
  }, [seed, base, upOdds]);

  const color = above ? UP : DOWN;
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      style={{ width: "100%", height: SPARK_H, display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <line
        x1={0}
        y1={baselineY}
        x2={SPARK_W}
        y2={baselineY}
        stroke="#4B5563"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={8} fill={color} opacity={0.16} />
      <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
      <text x={4} y={baselineY - 6} fontFamily="Archivo, sans-serif" fontSize={9} fill="#6B7280">
        Open {fmtUsd(base)}
      </text>
    </svg>
  );
};

/** Tier-1 direction button. */
const DirectionButton = ({
  label,
  price,
  tone,
  minHeight,
  labelSize,
  priceSize,
  centered,
  onClick,
}: {
  label: string;
  price: number;
  tone: "up" | "down";
  minHeight: number;
  labelSize: number;
  priceSize: number;
  centered?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`chip-t1 ${tone === "up" ? "chip-t1-up" : "chip-t1-down"} box-border flex items-center ${
      centered ? "flex-none justify-center whitespace-nowrap" : "justify-between"
    }`}
    style={{
      borderRadius: 12,
      minHeight,
      padding: centered ? "0 15px" : "0 14px",
      gap: centered ? 5 : undefined,
    }}
  >
    <span style={{ fontSize: labelSize, fontWeight: 700 }}>{label}</span>
    <span
      className="font-display"
      style={{ fontSize: priceSize, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

const HistorySquares = ({ history }: { history: ("up" | "down")[] }) => {
  const last8 = history.slice(-8);
  return (
    <span className="flex items-center" style={{ gap: 9 }}>
      <span style={MICRO}>Last 8</span>
      <span className="flex" style={{ gap: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const v = last8[i - (8 - last8.length)];
          return (
            <span
              key={i}
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                background: v === "up" ? UP : v === "down" ? DOWN : "#1D2026",
              }}
            />
          );
        })}
      </span>
    </span>
  );
};

const CoinTile = ({
  coin,
  event,
  history,
  tickSeconds,
}: {
  coin: Coin;
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tickSeconds: number;
}) => {
  const navigate = useNavigate();
  const meta = COIN_META[coin];
  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const seed = event ? seedFromId(event.id) : 0;
  const base = event?.base_price ?? null;
  const upOdds = up ? up.price : 0.5;
  const price = derivedPrice(base, upOdds, seed, tickSeconds);
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const endMs = event?.end_date ? new Date(event.end_date).getTime() : null;

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(
      `/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`,
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go()}
      onKeyDown={(e) => {
        if (e.key === "Enter" && event)
          navigate(`/spot?event=${encodeURIComponent(event.id)}`);
      }}
      className="flex cursor-pointer flex-col"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 16,
        padding: 18,
        gap: 14,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 12 }}>
        <span className="flex items-center" style={{ gap: 11 }}>
          <AssetAvatar symbol={meta.ticker} kind="crypto" size={34} />
          <span className="flex flex-col" style={{ gap: 2 }}>
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
            <span className="flex items-baseline" style={{ gap: 8 }}>
              <span
                className="font-display"
                style={{
                  fontSize: 22,
                  color: "#fff",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {price != null ? fmtUsd(price) : "—"}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: pctColor(pct),
                }}
              >
                {fmtPct(pct)}
              </span>
            </span>
          </span>
        </span>
        <span className="flex flex-col items-end" style={{ gap: 2 }}>
          <span style={MICRO}>Closes</span>
          <span
            className="font-display"
            style={{
              fontSize: 20,
              color: ORANGE,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {endMs != null ? formatCountdown(endMs - Date.now()) : "--:--"}
          </span>
        </span>
      </div>

      {base != null ? (
        <CoinSpark seed={seed} base={base} upOdds={upOdds} above={pct >= 0} />
      ) : (
        <div style={{ height: SPARK_H }} />
      )}

      <div className="flex items-center justify-between" style={{ gap: 10 }}>
        <HistorySquares history={history} />
        <span
          style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}
        >
          {compactUsd(event?.volume ?? 0)} traded
        </span>
      </div>

      <div className="grid grid-cols-2" style={{ gap: 8 }}>
        <DirectionButton
          label="Up"
          price={up?.price ?? 0.5}
          tone="up"
          minHeight={48}
          labelSize={12}
          priceSize={17}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down?.price ?? 0.5}
          tone="down"
          minHeight={48}
          labelSize={12}
          priceSize={17}
          onClick={go("down")}
        />
      </div>
    </div>
  );
};

const TradingStockRow = ({
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
    navigate(`/spot?event=${encodeURIComponent(row.id)}${side ? `&side=${side}` : ""}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go()}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
      }}
      className="box-border flex cursor-pointer items-center"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "11px 14px",
        gap: 13,
      }}
    >
      <span className="flex min-w-0 flex-1 items-center" style={{ gap: 12 }}>
        <AssetAvatar symbol={ticker} kind="equity" size={44} />
        <span className="flex min-w-0 flex-col" style={{ gap: 1 }}>
          <span style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>{ticker}</span>
          <span className="truncate" style={{ fontSize: 12, color: "#6B7280" }}>
            {company}
          </span>
        </span>
      </span>
      <span
        className="flex flex-none flex-col items-end"
        style={{ gap: 1, marginRight: 4 }}
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
            color: pctColor(pct),
          }}
        >
          {fmtPct(pct)}
        </span>
      </span>
      <DirectionButton
        label="Up"
        price={row.upPrice}
        tone="up"
        minHeight={44}
        labelSize={13}
        priceSize={15}
        centered
        onClick={go("up")}
      />
      <DirectionButton
        label="Not up"
        price={row.downPrice}
        tone="down"
        minHeight={44}
        labelSize={13}
        priceSize={15}
        centered
        onClick={go("down")}
      />
    </div>
  );
};

const AsleepStockRow = ({
  row,
  nextOpen,
}: {
  row: StockEventRow;
  nextOpen: string;
}) => {
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket(row);
  return (
    <div
      className="box-border flex items-center"
      style={{
        background: "#0E1014",
        border: "1px solid #16181D",
        borderRadius: 14,
        padding: "11px 14px",
        gap: 13,
      }}
    >
      <span className="flex min-w-0 flex-1 items-center" style={{ gap: 12 }}>
        <span style={{ opacity: 0.55, display: "inline-flex" }}>
          <AssetAvatar symbol={ticker} kind="equity" size={44} />
        </span>
        <span className="flex min-w-0 flex-col" style={{ gap: 1 }}>
          <span style={{ fontSize: 15, color: "#9AA1AC", fontWeight: 700 }}>
            {ticker}
          </span>
          <span className="truncate" style={{ fontSize: 12, color: "#6B7280" }}>
            {company}
            {row.base_price != null
              ? ` · last close ${formatMarketPrice(row.base_price, market)}`
              : ""}
          </span>
        </span>
      </span>
      <span
        className="flex-none"
        style={{ fontSize: 12, color: "#6B7280", marginRight: 2 }}
      >
        Round opens {nextOpen}
      </span>
    </div>
  );
};

interface StockGroups {
  trading: StockEventRow[];
  asleep: Array<{ row: StockEventRow; nextOpen: string }>;
  sessionMarket: StockMarket | null;
  sessionEnd: number | null;
  wakeLabel: string | null;
}

export const LiteIntradayView = ({
  currentFor,
  historyFor,
  stockRows,
  tickSeconds,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  tickSeconds: number;
}) => {
  const [tf, setTf] = useState<Timeframe>("5m");

  const groups: StockGroups = useMemo(() => {
    const now = Date.now();
    const byTicker = new Map<string, StockEventRow[]>();
    for (const r of stockRows) {
      const t = deriveTickerFromEvent(r.id, r.name);
      byTicker.set(t, [...(byTicker.get(t) || []), r]);
    }
    const trading: StockEventRow[] = [];
    const asleep: Array<{ row: StockEventRow; nextOpen: string }> = [];
    let openMarket: StockMarket | null = null;
    let openCloseAt: number | null = null;
    let wake: { market: StockMarket; at: Date } | null = null;

    for (const rows of byTicker.values()) {
      // Newest round for the name — the one whose window has not expired.
      const live = rows
        .filter((r) => !r.end_date || new Date(r.end_date).getTime() > now)
        .sort(
          (a, b) =>
            new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime(),
        )[0];
      const row = live ?? rows[rows.length - 1];
      if (!row) continue;
      const market = resolveStockMarket(row);
      // Session state comes from the market calendar, never from the row's
      // 24h event window (that window spans bell-to-bell).
      const session = getMarketSession(market, new Date(now));
      if (live && session.open) {
        trading.push(row);
        if (!openMarket) {
          openMarket = market;
          openCloseAt = session.closeAt ? session.closeAt.getTime() : null;
        }
        continue;
      }
      asleep.push({ row, nextOpen: openStamp(session.nextOpenAt, market) });
      if (!wake || session.nextOpenAt.getTime() < wake.at.getTime()) {
        wake = { market, at: session.nextOpenAt };
      }
    }
    trading.sort(
      (a, b) => new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime(),
    );
    return {
      trading,
      asleep,
      sessionMarket: openMarket,
      sessionEnd: openCloseAt,
      wakeLabel: wake
        ? `${marketCityName(wake.market)} opens ${openStamp(wake.at, wake.market)}`
        : null,
    };
  }, [stockRows, tickSeconds]);

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
          <div
            className="flex"
            style={{
              background: "#131519",
              border: "1px solid #1D2026",
              borderRadius: 12,
              padding: 4,
              gap: 2,
            }}
          >
            {TIMEFRAMES.map((t) => {
              const active = t.id === tf;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTf(t.id)}
                  className={active ? undefined : "hover:text-white"}
                  style={{
                    background: active ? ORANGE : "transparent",
                    color: active ? "#0A0B0D" : "#9AA1AC",
                    borderRadius: 9,
                    padding: "0 18px",
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
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
                {fmtLeft(groups.sessionEnd - Date.now())}
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
