// ============================================================
// MOBILE INTRADAY MODULE (390) — rolling crypto rounds + the collapsed
// stock-session row. Contract: list-final-touches-11.html 11B / 11C.
// All counts and session state come from the real market calendar.
// ============================================================
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { RoundPlot } from "@/components/lite/intraday/RoundPlot";
import {
  COINS,
  COIN_META,
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
import {
  HK_STOCK_MARKET,
  KR_STOCK_MARKET,
  US_STOCK_MARKET,
  formatMarketTime,
  formatSessionStamp,
  getMarketSession,
  marketCityName,
  resolveStockMarket,
  type StockMarket,
} from "@/lib/usStockSessions";
import { Last8Strip, LivePulse } from "@/components/lite/shared/primitives";
import { DirectionButton } from "@/components/lite/categoryviews/verticalBlocks";

const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

const cents = (p: number) => `${Math.round(p * 100)}¢`;

/** Chart slot height for the crypto round tile at 390. */
const PLOT_H = 84;

/** Mobile coin card — reused by the Crypto vertical view. */
export const MobileCoinCard = ({
  coin,
  event,
  history,
  tf,
  tickSeconds,
  nowMs,
}: {
  coin: (typeof COINS)[number];
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tf: Timeframe;
  tickSeconds: number;
  /** Style-guide only — freeze the countdown clock. */
  nowMs?: number;
}) => {
  const navigate = useNavigate();
  const meta = COIN_META[coin];
  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const base = event?.base_price ?? null;
  const seed = event ? seedFromId(event.id) : 0;
  const upOdds = up ? up.price : 0.5;
  const price = derivedPrice(base, upOdds, seed, tickSeconds);
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const endMs = event?.end_date ? new Date(event.end_date).getTime() : null;
  const tfLabel = TIMEFRAMES.find((t) => t.id === tf)?.label ?? tf;

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;
    navigate(
      `/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`,
    );
  };

  if (!event) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/spot?event=${encodeURIComponent(event.id)}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(event.id)}`);
      }}
      className="flex cursor-pointer flex-col"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "13px 14px",
        gap: 11,
      }}
    >
      <div className="flex items-center" style={{ gap: 11 }}>
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={32} />
        <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 1 }}>
          <span
            style={{ fontSize: 10, color: "#9AA1AC", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            {meta.ticker} · {tfLabel} round
          </span>
          <span className="flex items-baseline" style={{ gap: 7 }}>
            <span
              className="font-display"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
              }}
            >
              {price != null
                ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : "—"}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: pct >= 0 ? "hsl(var(--trading-green))" : "hsl(var(--trading-red))",
              }}
            >
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(2)}%
            </span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end" style={{ gap: 1 }}>
          <span style={MICRO}>Closes</span>
          <span
            className="font-display"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#FF8A3D",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {endMs != null ? formatCountdown(endMs - (nowMs ?? Date.now())) : "—"}
          </span>
        </span>
      </div>

      <div style={{ borderRadius: 9, overflow: "hidden" }}>
        {base != null && price != null ? (
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
        <Last8Strip
          history={history}
          variant="strip"
          dot={10}
          outerGap={8}
          innerGap={3}
          pad={false}
          labelStyle={MICRO}
        />
        {/* Round-open value now lives in the RoundPlot pill — no duplicate here. */}
      </div>

      <div className="flex" style={{ gap: 8 }}>
        <DirectionButton
          label="Up"
          price={up?.price ?? 0.5}
          tone="up"
          grow
          minHeight={48}
          radius={11}
          padding="0 13px"
          labelSize={12}
          priceSize={16}
          onClick={go("up")}
        />
        <DirectionButton
          label="Down"
          price={down?.price ?? 0.5}
          tone="down"
          grow
          minHeight={48}
          radius={11}
          padding="0 13px"
          labelSize={12}
          priceSize={16}
          onClick={go("down")}
        />
      </div>
    </div>
  );
};

const SessionRow = ({
  market,
  count,
  closeAt,
  onOpen,
}: {
  market: StockMarket;
  count: number;
  closeAt: Date;
  onOpen: () => void;
}) => {
  const leftMs = closeAt.getTime() - Date.now();
  const h = Math.max(0, Math.floor(leftMs / 3_600_000));
  const m = Math.max(0, Math.floor((leftMs % 3_600_000) / 60_000));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center text-left"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 14,
        padding: "0 14px",
        minHeight: 56,
        gap: 11,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: 999, background: "#FF8A3D", flex: "none" }}
      />
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
        <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
          {marketCityName(market)} session open · {count} stock{" "}
          {count === 1 ? "round" : "rounds"}
        </span>
        <span
          style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}
        >
          Closes {formatMarketTime(closeAt, market)} {market.label} · {h}h {m}m left
        </span>
      </span>
      <span style={{ fontSize: 12, color: "#FF8A3D", fontWeight: 700, flex: "none" }}>
        Open →
      </span>
    </button>
  );
};

/** Mobile round switcher — compact dial grammar (all five windows). */
export const MobileRoundSwitcher = ({
  value,
  onSelect,
}: {
  value: Timeframe;
  onSelect: (tf: Timeframe) => void;
}) => (
  <div
    className="flex items-center justify-between"
    style={{
      gap: 10,
      background: "#131519",
      border: "1px solid #1D2026",
      borderRadius: 12,
      padding: "8px 10px",
    }}
  >
    <span style={{ ...MICRO, flex: "none" }}>Round</span>
    <span
      className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ gap: 5 }}
    >
      {TIMEFRAMES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            style={{
              flex: "none",
              borderRadius: 9,
              padding: "0 14px",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              fontWeight: active ? 700 : 600,
              background: active ? "#FF8A3D" : "transparent",
              color: active ? "#0A0B0D" : "#9AA1AC",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </span>
  </div>
);

export const MobileIntradayModule = ({
  currentFor,
  historyFor,
  stockRows,
  tf,
  onSelectTf,
  tickSeconds,
  onOpenIntraday,
  boostOnly,
}: {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  stockRows: StockEventRow[];
  tf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  tickSeconds: number;
  onOpenIntraday: () => void;
  /** Boost composes in place: no boost rounds exist yet, so the engine hides. */
  boostOnly?: boolean;
}) => {
  // Every exchange with rounds today gets its own row — sessions can overlap
  // (HK 09:30–16:00 HKT and KR 09:00–15:30 KST run almost in parallel).
  const openSessions = [US_STOCK_MARKET, HK_STOCK_MARKET, KR_STOCK_MARKET]
    .map((market) => ({
      session: getMarketSession(market),
      count: stockRows.filter((r) => resolveStockMarket(r).key === market.key).length,
    }))
    .filter((s) => s.session.open && s.session.closeAt && s.count > 0)
    .sort(
      (a, b) =>
        (a.session.closeAt as Date).getTime() - (b.session.closeAt as Date).getTime(),
    );

  return (
    <section className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex flex-col" style={{ gap: 7 }}>
        <span
          className="flex items-center"
          style={{
            gap: 7,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#FF8A3D",
            fontWeight: 700,
          }}
        >
          <LivePulse size={6} color="#FF8A3D" />
          Intraday · rolling rounds
        </span>
        <h2
          className="font-display"
          style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: "#fff" }}
        >
          Will the price go up?
        </h2>
        <p style={{ fontSize: 12, color: "#9AA1AC" }}>
          Pick Up or Down before the clock hits zero. Winning shares pay{" "}
          <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>, losing shares
          pay $0.
        </p>
      </div>

      {/* Round dial — all five rounds, always. */}
      <MobileRoundSwitcher value={tf} onSelect={onSelectTf} />

      {boostOnly ? (
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          Nothing boosted here yet — check back soon.
        </span>
      ) : (
        <>
      {COINS.map((coin) => (
        <MobileCoinCard
          key={coin}
          coin={coin}
          event={currentFor.get(`${coin}-${tf}`) ?? null}
          history={historyFor.get(`${coin}-${tf}`) ?? []}
          tf={tf}
          tickSeconds={tickSeconds}
        />
      ))}

      {openSessions.length > 0 ? (
        openSessions.map(({ session, count }) => (
          <SessionRow
            key={session.market.key}
            market={session.market}
            count={count}
            closeAt={session.closeAt as Date}
            onOpen={onOpenIntraday}
          />
        ))
      ) : (
        <span style={{ fontSize: 11, color: "#6B7280" }}>
          Stock rounds are closed.{" "}
          {[US_STOCK_MARKET, HK_STOCK_MARKET, KR_STOCK_MARKET]
            .map(
              (m) =>
                `${marketCityName(m)} opens ${formatSessionStamp(getMarketSession(m).nextOpenAt, m)}`,
            )
            .join(", ")}
          .
        </span>
      )}
        </>
      )}
    </section>
  );
};

export default MobileIntradayModule;