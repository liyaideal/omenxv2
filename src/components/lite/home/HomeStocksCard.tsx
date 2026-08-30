// ============================================================
// HOME · STOCKS CLOSING TODAY (HP-1)
// US / HK tabs over the daily up-down stock rounds. Rows stretch to
// fill the left column so the two stage columns end flush.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { DirectionButton } from "@/components/lite/categoryviews/verticalBlocks";
import { PctChange } from "@/components/lite/shared/primitives";
import {
  HK_STOCK_SUBTYPE,
  StockEventRow,
  US_STOCK_SUBTYPE,
  seedFromId,
} from "@/components/lite/intraday/intradayData";
import { deriveTickerFromEvent, STOCK_NAME } from "@/components/SpotStatsHeader";
import {
  formatLocalTime,
  formatMarketPrice,
  formatMinuteCountdown,
  getStockSessionState,
  resolveStockMarket,
  type StockSessionPhase,
} from "@/lib/usStockSessions";
import { CYAN, HomeCard, HomeEyebrow, HomeQuestion, LIME, MUTED } from "./homeShell";

type TabId = "us" | "hk";

const DISABLED: React.CSSProperties = {
  borderRadius: 12,
  minHeight: 38,
  padding: "0 13px",
  fontSize: 13.5,
  fontWeight: 700,
  color: "#6B7280",
  background: "#131519",
  border: "1px solid #1D2026",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

/** Deterministic frozen close for the session that just ended (DEMO-STATE). */
const frozenClose = (base: number, seed: number) =>
  base * (1 + ((seed % 200) - 100) / 10000);

/**
 * HP-3 · mobile stock row — a rounded row card: 40px logo, ticker over
 * company name, price over %, and the compact Up / Down pair. Session meta
 * is market-level and lives in the module head, never in the row.
 */
const MobileStockRow = ({
  row,
  tickSeconds,
  nowOverride,
}: {
  row: StockEventRow;
  tickSeconds: number;
  nowOverride?: Date;
}) => {
  const navigate = useNavigate();
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const company = STOCK_NAME[ticker] ?? ticker;
  const market = resolveStockMarket(row);
  const session = getStockSessionState(market, nowOverride);
  const base = row.base_price;
  const seed = seedFromId(row.id);
  const livePrice =
    base != null ? base * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009) : null;
  const phase: StockSessionPhase = session.phase;
  const state: StockSessionPhase | "stale" = base == null ? "stale" : phase;
  const price =
    state === "live" ? livePrice : base != null ? frozenClose(base, seed) : null;
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const priceText = price != null ? formatMarketPrice(price, market) : "—";

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/spot?event=${encodeURIComponent(row.id)}${side ? `&side=${side}` : ""}`);
  };
  const clickable = state !== "stale";

  const pair = (
    <span className="flex flex-none" style={{ gap: 6 }}>
      <DirectionButton
        label="Up"
        price={row.upPrice}
        tone="up"
        layout="centered"
        minHeight={34}
        radius={10}
        labelSize={11.5}
        priceSize={11.5}
        gap={5}
        padding="0 9px"
        onClick={go("up")}
      />
      <DirectionButton
        label="Down"
        price={row.downPrice}
        tone="down"
        layout="centered"
        minHeight={34}
        radius={10}
        labelSize={11.5}
        priceSize={11.5}
        gap={5}
        padding="0 9px"
        onClick={go("down")}
      />
    </span>
  );

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? go() : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
            }
          : undefined
      }
      className={`flex items-center ${clickable ? "cursor-pointer" : ""}`}
      style={{
        gap: 9,
        minHeight: 60,
        padding: "10px",
        marginBottom: 8,
        borderRadius: 14,
        background: "#191D24",
        border: "1px solid rgba(148,163,184,0.10)",
      }}
    >
      <AssetAvatar symbol={ticker} kind="equity" size={40} />
      <span className="flex min-w-0 flex-col">
        <span
          className="truncate"
          style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}
        >
          {ticker}
        </span>
        <span className="truncate" style={{ fontSize: 12, color: MUTED }}>
          {company}
        </span>
      </span>
      <span className="ml-auto flex flex-none flex-col items-end">
        {state === "preSession" && (
          <span style={{ fontSize: 10, color: MUTED }}>Last close</span>
        )}
        <span
          className="font-display"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: state === "preSession" ? MUTED : "#F2F3F5",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {state === "stale" ? "—" : priceText}
        </span>
        {(state === "live" || state === "settling") && (
          <PctChange value={pct} size={11.5} weight={600} />
        )}
      </span>
      {state === "live" || state === "preSession" ? (
        pair
      ) : state === "settling" ? (
        <span className="flex flex-none flex-col items-end" style={{ gap: 4 }}>
          <span
            className="font-display"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: pct >= 0 ? CYAN : LIME,
              border: `1px solid ${pct >= 0 ? "rgba(51,214,255,.45)" : "rgba(207,255,74,.45)"}`,
              borderRadius: 999,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            Closed {pct >= 0 ? "↑" : "↓"}
          </span>
          <span
            style={{
              ...DISABLED,
              minHeight: 26,
              padding: "0 9px",
              borderRadius: 10,
              fontSize: 11,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Next session in{" "}
            {session.settlingEndsAt
              ? formatMinuteCountdown(session.settlingEndsAt, nowOverride)
              : "00:00"}
          </span>
        </span>
      ) : (
        <span style={{ ...DISABLED, minHeight: 30, fontSize: 12 }}>Unavailable</span>
      )}
    </div>
  );
};

const StockRow = ({
  row,
  tickSeconds,
  isMobile,
  nowOverride,
}: {
  row: StockEventRow;
  tickSeconds: number;
  isMobile: boolean;
  /** Style-guide fixture only. Absent → live clock (production behaviour). */
  nowOverride?: Date;
}) => {
  const navigate = useNavigate();
  if (isMobile)
    return <MobileStockRow row={row} tickSeconds={tickSeconds} nowOverride={nowOverride} />;
  const ticker = deriveTickerFromEvent(row.id, row.name);
  const market = resolveStockMarket(row);
  const session = getStockSessionState(market, nowOverride);
  const base = row.base_price;
  const seed = seedFromId(row.id);
  const livePrice =
    base != null ? base * (1 + Math.sin(tickSeconds / 3 + (seed % 7)) * 0.009) : null;

  const phase: StockSessionPhase = session.phase;
  const state: StockSessionPhase | "stale" = base == null ? "stale" : phase;

  const price =
    state === "live"
      ? livePrice
      : base != null
        ? frozenClose(base, seed)
        : null;
  const pct = base && price ? ((price - base) / base) * 100 : 0;

  const go = (side?: "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/spot?event=${encodeURIComponent(row.id)}${side ? `&side=${side}` : ""}`);
  };

  const clickable = state !== "stale";
  // Mobile keeps the two-layer row grammar used across Lite lists: the
  // session meta (Last close / result) drops to a second line.
  const mobileMeta = isMobile && (state === "preSession" || state === "settling");

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? go() : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter") navigate(`/spot?event=${encodeURIComponent(row.id)}`);
            }
          : undefined
      }
      className={`flex flex-col ${clickable ? "cursor-pointer" : ""}`}
      style={{
        padding: isMobile ? "7px 0" : "8px 0",
        borderBottom: "1px solid rgba(148,163,184,0.07)",
      }}
    >
      <div className="flex items-center" style={{ gap: isMobile ? 10 : 13 }}>

      <AssetAvatar symbol={ticker} kind="equity" size={isMobile ? 26 : 28} />
      <span
        className="flex-none"
        style={{
          fontWeight: 700,
          fontSize: isMobile ? 14 : 15,
          color: "#fff",
          width: isMobile ? undefined : 62,
        }}
      >
        {ticker}
      </span>

      {mobileMeta ? null : state === "stale" ? (
        <span
          className="animate-pulse"
          style={{ width: 78, height: 14, borderRadius: 6, background: "#191D24" }}
        />
      ) : state === "preSession" ? (

        <span
          className="font-display min-w-0 truncate"
          style={{
            fontSize: isMobile ? 11.5 : 13,
            fontWeight: 600,
            color: MUTED,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Last close {price != null ? formatMarketPrice(price, market) : "—"}
        </span>
      ) : (

        <>
          <span
            className="font-display"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#F2F3F5",
              width: isMobile ? undefined : 78,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {price != null ? formatMarketPrice(price, market) : "—"}
          </span>
          {!isMobile && <PctChange value={pct} size={12} weight={600} />}
        </>
      )}
      <span className="flex-1" />
      {state === "live" ? (
        <>
          <DirectionButton
            label="Up"
            price={row.upPrice}
            tone="up"
            minHeight={38}
            labelSize={13.5}
            priceSize={13.5}

            gap={8}
            onClick={go("up")}
          />
          <DirectionButton
            label="Down"
            price={row.downPrice}
            tone="down"
            minHeight={38}
            labelSize={13.5}
            priceSize={13.5}

            gap={8}
            onClick={go("down")}
          />
        </>
      ) : state === "settling" ? (
        <>
          {!mobileMeta && (
            <span
              className="font-display"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: pct >= 0 ? CYAN : LIME,
                border: `1px solid ${pct >= 0 ? "rgba(51,214,255,.45)" : "rgba(207,255,74,.45)"}`,
                borderRadius: 999,
                padding: "3px 10px",
                whiteSpace: "nowrap",
              }}
            >
              Closed {pct >= 0 ? "↑" : "↓"}
            </span>
          )}
          <span
            style={{
              ...DISABLED,
              fontVariantNumeric: "tabular-nums",
              fontSize: isMobile ? 12 : 13.5,
            }}
          >
            Next session in{" "}
            {session.settlingEndsAt
              ? formatMinuteCountdown(session.settlingEndsAt, nowOverride)
              : "00:00"}
          </span>
        </>
      ) : state === "preSession" ? (
        <>
          {!isMobile && (
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.06em",
                color: MUTED,
                whiteSpace: "nowrap",
              }}
            >
              NEXT SESSION · opens {formatLocalTime(session.nextOpenAt)}
            </span>
          )}
          <span className="flex flex-none" style={{ gap: isMobile ? 8 : 13 }}>
            <DirectionButton
              label="Up"
              price={row.upPrice}
              tone="up"
              minHeight={38}
              labelSize={13.5}
              priceSize={13.5}
              gap={8}
              onClick={go("up")}
            />
            <DirectionButton
              label="Down"
              price={row.downPrice}
              tone="down"
              minHeight={38}
              labelSize={13.5}
              priceSize={13.5}
              gap={8}
              onClick={go("down")}
            />
          </span>
        </>
      ) : (
        <span style={DISABLED}>Unavailable</span>
      )}
      </div>

      {mobileMeta && (
        <div
          className="font-mono flex items-center"
          style={{
            gap: 6,
            marginTop: 5,
            paddingLeft: 36,
            fontSize: 11,
            letterSpacing: "0.04em",
            color: MUTED,
          }}
        >
          {state === "settling" ? (
            <>
              <span style={{ color: pct >= 0 ? CYAN : LIME, fontWeight: 700 }}>
                Closed {pct >= 0 ? "↑" : "↓"}
              </span>
              <span>{price != null ? formatMarketPrice(price, market) : "—"}</span>
            </>
          ) : (
            <>
              <span>
                Last close {price != null ? formatMarketPrice(price, market) : "—"}
              </span>
              <span>·</span>
              <span>NEXT SESSION · opens {formatLocalTime(session.nextOpenAt)}</span>
            </>
          )}
        </div>
      )}
    </div>
  );

};


export const HomeStocksCard = ({
  stockRows,
  tickSeconds,
  isMobile,
  loading,
  nowOverride,
}: {
  stockRows: StockEventRow[];
  tickSeconds: number;
  isMobile: boolean;
  loading: boolean;
  /** Style-guide fixture only. Absent → live clock (production behaviour). */
  nowOverride?: Date;
}) => {
  const [tab, setTab] = useState<TabId>("us");
  const [expanded, setExpanded] = useState(false);


  const { us, hk } = useMemo(() => {
    const dedupe = (rows: StockEventRow[]) => {
      const seen = new Map<string, StockEventRow>();
      for (const r of rows) {
        const t = deriveTickerFromEvent(r.id, r.name);
        if (!seen.has(t)) seen.set(t, r);
      }
      return [...seen.values()];
    };
    return {
      us: dedupe(stockRows.filter((r) => r.event_subtype === US_STOCK_SUBTYPE)),
      hk: dedupe(stockRows.filter((r) => r.event_subtype === HK_STOCK_SUBTYPE)),
    };
  }, [stockRows]);

  const rows = tab === "us" ? us : hk;
  const total = us.length + hk.length;
  const MOBILE_ROWS = 5;
  const visibleRows = isMobile && !expanded ? rows.slice(0, MOBILE_ROWS) : rows;


  const settleLine = useMemo(() => {
    const sample = (tab === "hk" ? hk : us)[0];
    const market = resolveStockMarket(sample ?? { id: tab === "hk" ? "hk-" : "us-" });
    const session = getStockSessionState(market, nowOverride);
    if (session.phase === "settling") {
      return `Settled · next session in ${
        session.settlingEndsAt
          ? formatMinuteCountdown(session.settlingEndsAt, nowOverride)
          : "00:00"
      }`;
    }
    if (session.phase === "preSession") {
      return tab === "hk"
        ? "Next session · HK opens 09:30 HKT"
        : `Next session · US opens ${formatLocalTime(session.nextOpenAt)}`;
    }
    return tab === "hk"
      ? "HK settles at close 16:00 HKT"
      : `US settles at close ${formatLocalTime(session.closeAt ?? session.nextOpenAt)}`;
    // tickSeconds keeps the settling countdown live.
  }, [tab, us, hk, tickSeconds, nowOverride]);


  if (!loading && total === 0) return null;

  return (
    <HomeCard
      className="flex h-full flex-col"
      style={{ padding: isMobile ? "18px 16px" : "22px 28px" }}
    >
      <div className="flex items-baseline" style={{ gap: 14 }}>
        <HomeEyebrow color={CYAN}>Stocks · Closing today</HomeEyebrow>
        {!isMobile && (
          <span
            className="font-display ml-auto"
            style={{ color: MUTED, fontSize: 13, fontVariantNumeric: "tabular-nums" }}
          >
            {total} stocks · {settleLine}
          </span>
        )}
      </div>
      <div
        className={isMobile ? "flex flex-col" : "flex items-center"}
        style={{ gap: isMobile ? 10 : 16, marginTop: 8 }}
      >
        <HomeQuestion size={isMobile ? 18 : 22}>
          Will it finish higher than it opened?
        </HomeQuestion>
        <span className={isMobile ? "" : "ml-auto"}>
          <span
            className="flex w-fit"
            style={{
              gap: 4,
              background: "#0E1116",
              border: "1px solid rgba(148,163,184,0.14)",
              borderRadius: 11,
              padding: 3,
            }}
          >
            {(["us", "hk"] as TabId[]).map((id) => {
              const active = id === tab;
              const n = id === "us" ? us.length : hk.length;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className="font-display"
                  style={{
                    fontSize: 12.5,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: active ? "#FFFFFF" : "transparent",
                    color: active ? "#0B0D11" : MUTED,
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {id.toUpperCase()} · {n}
                </button>
              );
            })}
          </span>
        </span>
      </div>

      <div
        className="flex flex-1 flex-col"
        style={{ justifyContent: isMobile ? "flex-start" : "space-evenly", marginTop: 4 }}
      >
        {loading && rows.length === 0
          ? Array.from({ length: isMobile ? 5 : 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 38,
                  margin: "8px 0",
                  borderRadius: 10,
                  background: "#191D24",
                }}
              />
            ))
          : visibleRows.map((row) => (
              <StockRow
                key={row.id}
                row={row}
                tickSeconds={tickSeconds}
                isMobile={isMobile}
                nowOverride={nowOverride}
              />
            ))}
      </div>
      {isMobile && rows.length > MOBILE_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-display w-full"
          style={{ marginTop: 12, fontSize: 13, color: CYAN, textAlign: "left" }}
        >
          {expanded ? "Show less" : `Show all ${rows.length} →`}
        </button>
      )}

    </HomeCard>
  );
};

export default HomeStocksCard;
