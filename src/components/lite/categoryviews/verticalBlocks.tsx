// ============================================================
// SHARED VERTICAL BLOCKS — extracted verbatim from LiteIntradayView so
// the Crypto and Finance vertical views can reuse the SAME rendered
// pixels (coin tile, stock rows, round-length dial, direction button).
// Zero visual change: the markup below is byte-identical to what the
// Intraday view shipped before the extraction.
// ============================================================
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import {
  DIR_DOWN,
  DIR_UP,
  Last8Strip,
  PctChange,
  PriceReadout,
  pctColor as sharedPctColor,
} from "@/components/lite/shared/primitives";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import {
  formatMarketPrice,
  formatSessionStamp,
  formatMarketTime,
  getMarketSession,
  marketCityName,
  resolveStockMarket,
  StockMarket,
} from "@/lib/usStockSessions";
import {
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
  upOptionOf,
} from "@/components/lite/intraday/intradayData";

export const ORANGE = "#FF8A3D";
export const UP = DIR_UP;
export const DOWN = DIR_DOWN;

export const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

export const fmtUsd = (v: number) =>
  `$${v.toLocaleString(undefined, {
    minimumFractionDigits: v < 1000 ? 2 : 0,
    maximumFractionDigits: v < 1000 ? 2 : 0,
  })}`;

/** Re-exported so existing call sites keep one colour law. */
export const pctColor = sharedPctColor;

export const fmtPct = (pct: number) =>
  `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(2)}%`;

/** "3h 12m left" / "48m left". */
export const fmtLeft = (ms: number) => {
  const mins = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
};

/** "Tue 09:30 HKT" for a market-local instant. */
export const openStamp = (d: Date, market: StockMarket) => formatSessionStamp(d, market);

/** Chart slot height for the crypto round tile (desktop vertical views). */
const PLOT_H = 96;

/**
 * Tier-1 direction button — THE binary direction pair for every Lite surface.
 * `layout` covers the three shipped shapes:
 *   split    — label left, price right (coin tiles, mobile intraday)
 *   centered — label + price hugged, non-growing (stock rows)
 *   stacked  — label over price (calendar tickets)
 */
export const DirectionButton = ({
  label,
  price,
  tone,
  minHeight,
  labelSize,
  priceSize,
  layout = "split",
  radius = 12,
  padding,
  gap,
  grow,
  labelWeight = 700,
  onClick,
}: {
  label: string;
  price: number;
  tone: "up" | "down";
  minHeight?: number;
  labelSize: number;
  priceSize: number;
  layout?: "split" | "centered" | "stacked";
  radius?: number;
  padding?: string;
  gap?: number;
  grow?: boolean;
  labelWeight?: number;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`chip-t1 ${tone === "up" ? "chip-t1-up" : "chip-t1-down"} box-border flex ${
      layout === "stacked"
        ? "flex-col items-center justify-center"
        : layout === "centered"
          ? "flex-none items-center justify-center whitespace-nowrap"
          : "items-center justify-between"
    }${grow ? " flex-1" : ""}`}
    style={{
      borderRadius: radius,
      minHeight,
      padding: padding ?? (layout === "centered" ? "0 15px" : "0 14px"),
      gap: gap ?? (layout === "centered" ? 5 : undefined),
    }}
  >
    <span style={{ fontSize: labelSize, fontWeight: labelWeight }}>{label}</span>
    <span
      className="font-display"
      style={{ fontSize: priceSize, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
    >
      {Math.round(price * 100)}¢
    </span>
  </button>
);

/** Vertical-view density of the shared Last-8 strip. */
export const HistorySquares = ({ history }: { history: ("up" | "down")[] }) => (
  <Last8Strip history={history} variant="squares" labelStyle={MICRO} />
);

export const CoinTile = ({
  coin,
  event,
  history,
  tickSeconds,
  nowMs,
}: {
  coin: Coin;
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tickSeconds: number;
  /** Style-guide only — freeze the countdown clock. */
  nowMs?: number;
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
              <PriceReadout
                text={price != null ? fmtUsd(price) : "—"}
                size={22}
                letterSpacing="-0.02em"
              />
              <PctChange value={pct} size={12} weight={700} />
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
            {endMs != null ? formatCountdown(endMs - (nowMs ?? Date.now())) : "--:--"}
          </span>
        </span>
      </div>

      <div style={{ borderRadius: 10, overflow: "hidden" }}>
        {base != null && price != null && event ? (
          <RoundPlot
            eventId={event.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={PLOT_H}
          />
        ) : (
          <div style={{ height: PLOT_H, background: "#0C1013" }} />
        )}
      </div>

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

export const TradingStockRow = ({
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
        <PriceReadout
          text={price != null ? formatMarketPrice(price, market) : "—"}
          size={16}
        />
        <PctChange value={pct} size={12} weight={700} />
      </span>
      <DirectionButton
        label="Up"
        price={row.upPrice}
        tone="up"
        minHeight={44}
        labelSize={13}
        priceSize={15}
        layout="centered"
        onClick={go("up")}
      />
      <DirectionButton
        label="Not up"
        price={row.downPrice}
        tone="down"
        minHeight={44}
        labelSize={13}
        priceSize={15}
        layout="centered"
        onClick={go("down")}
      />
    </div>
  );
};

export const AsleepStockRow = ({
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


/** Round dial (module size) — the Intraday header control, verbatim. */
export const RoundDial = ({
  value,
  onSelect,
}: {
  value: Timeframe;
  onSelect: (tf: Timeframe) => void;
}) => (
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
      const active = t.id === value;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
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
);

export interface StockGroups {
  trading: StockEventRow[];
  asleep: Array<{ row: StockEventRow; nextOpen: string }>;
  /** Every exchange currently open, earliest close first. */
  openSessions: Array<{ market: StockMarket; closeAt: number }>;
  /** Compat: the earliest-closing open market (null when all shut). */
  sessionMarket: StockMarket | null;
  sessionEnd: number | null;
  wakeLabel: string | null;
  /** Every non-open region's wake stamp, earliest first. */
  wakeLabels: string[];
}

/** Session-aware grouping of the daily stock rounds (extracted verbatim). */
export const groupStockRows = (
  stockRows: StockEventRow[],
  sessionNow?: Date,
): StockGroups => {
  // One clock for EVERYTHING: row liveness and session resolution both read
  // the injected instant when present (style-guide frozen clock).
  const now = sessionNow ? sessionNow.getTime() : Date.now();
  const byTicker = new Map<string, StockEventRow[]>();
  for (const r of stockRows) {
    const t = deriveTickerFromEvent(r.id, r.name);
    byTicker.set(t, [...(byTicker.get(t) || []), r]);
  }
  const trading: StockEventRow[] = [];
  const asleep: Array<{ row: StockEventRow; nextOpen: string }> = [];
  const opens = new Map<string, { market: StockMarket; closeAt: number }>();
  let wake: { market: StockMarket; at: Date } | null = null;
  const wakes = new Map<string, { market: StockMarket; at: Date }>();

  for (const rows of byTicker.values()) {
    const live = rows
      .filter((r) => !r.end_date || new Date(r.end_date).getTime() > now)
      .sort(
        (a, b) =>
          new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime(),
      )[0];
    const row = live ?? rows[rows.length - 1];
    if (!row) continue;
    const market = resolveStockMarket(row);
    const session = getMarketSession(market, sessionNow ?? new Date(now));
    if (live && session.open) {
      trading.push(row);
      if (!opens.has(market.key) && session.closeAt)
        opens.set(market.key, { market, closeAt: session.closeAt.getTime() });
      continue;
    }
    asleep.push({ row, nextOpen: openStamp(session.nextOpenAt, market) });
    const prev = wakes.get(market.key);
    if (!prev || session.nextOpenAt.getTime() < prev.at.getTime())
      wakes.set(market.key, { market, at: session.nextOpenAt });
    if (!wake || session.nextOpenAt.getTime() < wake.at.getTime()) {
      wake = { market, at: session.nextOpenAt };
    }
  }
  trading.sort(
    (a, b) => new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime(),
  );
  const openSessions = [...opens.values()].sort((a, b) => a.closeAt - b.closeAt);
  return {
    trading,
    asleep,
    openSessions,
    sessionMarket: openSessions[0]?.market ?? null,
    sessionEnd: openSessions[0]?.closeAt ?? null,
    wakeLabel: wake
      ? `${marketCityName(wake.market)} opens ${openStamp(wake.at, wake.market)}`
      : null,
    wakeLabels: [...wakes.values()]
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map((w) => `${marketCityName(w.market)} opens ${openStamp(w.at, w.market)}`),
  };
};

/**
 * Session status chip — the EXACT treatment the Intraday view uses for
 * stock session state. Open → orange dot + "US session open · closes
 * 16:00 ET · 3h 12m left". Shut → the asleep phrasing with the next
 * open stamp (groups.wakeLabel).
 */
export const SessionStatusChip = ({
  groups,
  nowMs,
}: {
  groups: StockGroups;
  nowMs?: number;
}) => {
  const sessions = groups.openSessions ?? [];
  if (sessions.length === 0 && !groups.wakeLabel) return null;
  if (sessions.length > 0)
    return (
      <span
        className="flex flex-none items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: 8, maxWidth: "100%" }}
      >
        {sessions.map(({ market, closeAt }) => (
          <span
            key={market.key}
            className="flex flex-none items-center"
            style={{
              gap: 8,
              background: "#131519",
              border: "1px solid #23262D",
              borderRadius: 999,
              padding: "9px 15px",
            }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE }}
            />
            <span
              className="whitespace-nowrap"
              style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}
            >
              {market.short} session open
            </span>
            <span
              className="whitespace-nowrap"
              style={{
                fontSize: 12,
                color: "#9AA1AC",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              closes {formatMarketTime(new Date(closeAt), market)} {market.label} ·{" "}
              {fmtLeft(closeAt - (nowMs ?? Date.now()))}
            </span>
          </span>
        ))}
      </span>
    );
  return (
    <span
      className="flex flex-none items-center"
      style={{
        gap: 8,
        background: "#131519",
        border: "1px solid #23262D",
        borderRadius: 999,
        padding: "9px 15px",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#3A3F49",
        }}
      />
      <span style={{ fontSize: 12, color: "#9AA1AC" }}>{groups.wakeLabel}</span>
    </span>
  );
};
